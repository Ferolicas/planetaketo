import type Stripe from 'stripe';
import bcrypt from 'bcryptjs';
import { stripe, PRODUCT_CONFIG } from '@/lib/stripe/config';
import { query, queryOne } from '@/lib/db';
import { createMagicLink } from '@/lib/downloads/magic-link';
import { resend } from '@/lib/resend';
import { getPurchaseEmailTemplate } from '@/lib/email/templates';

const WHATSAPP_NUMBER = '+19176726696';
const FROM_EMAIL = 'Planeta Keto <info@planetaketo.es>';
const KETOSCAN_DEFAULT_PASSWORD = 'Cliente1234*';

export type ProcessSaleResult =
  | { status: 'created'; paymentId: string; emailSent: boolean }
  | { status: 'already_processed'; paymentId: string }
  | { status: 'skipped'; reason: string };

// ============================================================
// Efectos post-pago (best-effort: nunca tumban la venta)
// ============================================================

/** Alta/actualización en la tabla `newsletter` (TASK 3a). */
export async function upsertNewsletter(
  email: string,
  name: string | null,
  productName: string | null
): Promise<void> {
  await query(
    `INSERT INTO newsletter (email, name, product_name)
     VALUES ($1, $2, $3)
     ON CONFLICT (email) DO UPDATE SET
       name = COALESCE(EXCLUDED.name, newsletter.name),
       product_name = COALESCE(EXCLUDED.product_name, newsletter.product_name)`,
    [email.toLowerCase(), name ?? null, productName ?? null]
  );
}

/** Alta automática de cuenta ketoscan con contraseña genérica (TASK 3c). */
export async function ensureKetoscanAccount(email: string): Promise<void> {
  const hash = await bcrypt.hash(KETOSCAN_DEFAULT_PASSWORD, 10);
  await query(
    `INSERT INTO ketoscan_accounts (email, password_hash, must_change_password)
     VALUES ($1, $2, true)
     ON CONFLICT (email) DO NOTHING`,
    [email.toLowerCase(), hash]
  );
}

// ============================================================
// Núcleo idempotente de la venta (pg). Lo usan TODOS los caminos:
//   - webhook (checkout.session.completed / payment_intent.succeeded)
//   - complete-purchase (frontend)
//   - cron rescue-payments
// ============================================================

export interface FinalizeSaleOpts {
  stripePaymentId: string;
  stripeSessionId: string | null;
  email: string;
  name: string;
  country?: string | null;
  amount: number; // en unidades mayores (p.ej. euros)
  currency: string;
  status: string;
  productName: string;
  stripeCustomerId?: string | null;
}

export async function finalizeSale(
  opts: FinalizeSaleOpts
): Promise<ProcessSaleResult> {
  const email = opts.email?.trim();
  if (!email) return { status: 'skipped', reason: 'no_email' };

  // Idempotencia por stripe_payment_id
  const existing = await queryOne<{ id: string }>(
    `SELECT id FROM payments WHERE stripe_payment_id = $1`,
    [opts.stripePaymentId]
  );
  if (existing) return { status: 'already_processed', paymentId: existing.id };

  // Upsert de cliente por email
  let customerId: string;
  const existingCustomer = await queryOne<{ id: string }>(
    `SELECT id FROM customers WHERE email = $1`,
    [email]
  );
  if (existingCustomer) {
    await query(
      `UPDATE customers SET
         name = $2,
         stripe_customer_id = COALESCE($3, stripe_customer_id),
         country = COALESCE($4, country),
         updated_at = now()
       WHERE id = $1`,
      [existingCustomer.id, opts.name, opts.stripeCustomerId ?? null, opts.country ?? null]
    );
    customerId = existingCustomer.id;
  } else {
    const created = await queryOne<{ id: string }>(
      `INSERT INTO customers (email, name, stripe_customer_id, country)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [email, opts.name, opts.stripeCustomerId ?? null, opts.country ?? 'Unknown']
    );
    if (!created) throw new Error('No se pudo crear el cliente');
    customerId = created.id;
  }

  // Registro del pago (con defensa ante carrera)
  let paymentId: string;
  try {
    const payment = await queryOne<{ id: string }>(
      `INSERT INTO payments
         (customer_id, stripe_payment_id, stripe_session_id, amount, currency, status, product_name)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
      [
        customerId,
        opts.stripePaymentId,
        opts.stripeSessionId ?? null,
        opts.amount,
        opts.currency,
        opts.status,
        opts.productName,
      ]
    );
    if (!payment) throw new Error('No se pudo registrar el pago');
    paymentId = payment.id;
  } catch (err) {
    const raceWinner = await queryOne<{ id: string }>(
      `SELECT id FROM payments WHERE stripe_payment_id = $1`,
      [opts.stripePaymentId]
    );
    if (raceWinner) return { status: 'already_processed', paymentId: raceWinner.id };
    throw err;
  }

  // Efectos post-pago (no rompen la venta si fallan)
  const effects = await Promise.allSettled([
    upsertNewsletter(email, opts.name, opts.productName),
    ensureKetoscanAccount(email),
  ]);
  effects.forEach((r, i) => {
    if (r.status === 'rejected') {
      console.error(`[finalizeSale] efecto post-pago ${i} falló:`, r.reason);
    }
  });

  // Enlace mágico (libro servido por proxy desde Sanity en /api/download/[token])
  const { downloadUrl } = await createMagicLink(
    customerId,
    paymentId,
    PRODUCT_CONFIG.pdfFileName
  );
  await query(`UPDATE payments SET magic_link_created = true WHERE id = $1`, [paymentId]);

  // Email de compra
  let emailSent = false;
  try {
    const emailResult = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: '¡Gracias por tu compra! Tu Método Keto está listo 💚',
      html: getPurchaseEmailTemplate({
        customerName: opts.name,
        downloadUrl,
        whatsappNumber: WHATSAPP_NUMBER,
      }),
    });
    await query(
      `UPDATE payments SET email_sent = true, email_sent_at = now() WHERE id = $1`,
      [paymentId]
    );
    emailSent = true;
    console.log(`✅ Email enviado a ${email} | Resend ID: ${emailResult.data?.id}`);
  } catch (emailError) {
    console.error('❌ Envío de email falló:', emailError);
    // No tumbamos la venta: magic_link_created=true permite recuperación.
  }

  console.log(`🎉 VENTA PROCESADA | ${email} | ${opts.amount} ${opts.currency} | ${paymentId}`);
  return { status: 'created', paymentId, emailSent };
}

/**
 * Procesa una venta a partir de un PaymentIntent (flujo embebido / cron / frontend).
 * Idempotente. Mantiene la firma usada por complete-purchase y rescue-payments.
 */
export async function processSale(opts: {
  paymentIntent: Stripe.PaymentIntent;
  customerName: string;
  customerEmail: string;
  stripeCustomerId?: string | null;
  country?: string;
}): Promise<ProcessSaleResult> {
  const { paymentIntent, customerName, customerEmail, stripeCustomerId, country } = opts;

  if (paymentIntent.status !== 'succeeded') {
    return { status: 'skipped', reason: `payment_intent.status=${paymentIntent.status}` };
  }

  return finalizeSale({
    stripePaymentId: paymentIntent.id,
    stripeSessionId: null,
    email: customerEmail,
    name: customerName,
    country: country ?? null,
    amount: paymentIntent.amount / 100,
    currency: paymentIntent.currency,
    status: 'paid',
    productName: paymentIntent.metadata.productName || PRODUCT_CONFIG.name,
    stripeCustomerId: stripeCustomerId ?? null,
  });
}

/**
 * Extracción best-effort del email que Stripe recolectó (PaymentElement).
 * receipt_email → charge billing_details → payment_method.
 */
export async function extractStripeEmail(
  paymentIntent: Stripe.PaymentIntent
): Promise<{ email: string | null; name: string | null; country: string | null }> {
  let email: string | null = paymentIntent.receipt_email || null;
  let name: string | null = null;
  let country: string | null = null;

  const latestChargeId = (paymentIntent.latest_charge as string) || null;
  if (latestChargeId) {
    try {
      const charge = await stripe.charges.retrieve(latestChargeId);
      email = email || charge.billing_details?.email || null;
      name = charge.billing_details?.name || null;
      country = charge.billing_details?.address?.country || null;
    } catch {}
  }

  if ((!email || !name) && paymentIntent.payment_method) {
    try {
      const pm = await stripe.paymentMethods.retrieve(
        paymentIntent.payment_method as string
      );
      email = email || pm.billing_details?.email || null;
      name = name || pm.billing_details?.name || null;
      country = country || pm.billing_details?.address?.country || null;
    } catch {}
  }

  return { email, name, country };
}
