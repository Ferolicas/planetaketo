import type Stripe from 'stripe';
import { stripe, PRODUCT_CONFIG } from '@/lib/stripe/config';
import { supabaseAdmin } from '@/lib/supabase';
import { createMagicLink } from '@/lib/downloads/magic-link';
import { Resend } from 'resend';
import { getPurchaseEmailTemplate } from '@/lib/email/templates';

const resend = new Resend(process.env.RESEND_API_KEY);
const WHATSAPP_NUMBER = '+19176726696';

export type ProcessSaleResult =
  | { status: 'created'; paymentId: string; emailSent: boolean }
  | { status: 'already_processed'; paymentId: string }
  | { status: 'skipped'; reason: string };

/**
 * Process a successful Stripe PaymentIntent into a sale:
 *  - Idempotent on stripe_payment_id
 *  - Creates/updates customer
 *  - Creates payment row
 *  - Creates magic download link
 *  - Sends purchase email
 *
 * Used by both:
 *  - /api/stripe/complete-purchase (frontend hands us the customer data)
 *  - /api/cron/rescue-payments (server falls back to Stripe-collected email)
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

  if (!customerEmail) {
    return { status: 'skipped', reason: 'no_email' };
  }

  // Idempotency
  const { data: existing } = await supabaseAdmin
    .from('payments')
    .select('id')
    .eq('stripe_payment_id', paymentIntent.id)
    .maybeSingle();

  if (existing) {
    return { status: 'already_processed', paymentId: existing.id };
  }

  // Upsert customer
  let dbCustomer;
  const { data: existingCustomer } = await supabaseAdmin
    .from('customers')
    .select('*')
    .eq('email', customerEmail)
    .maybeSingle();

  if (existingCustomer) {
    const { data, error } = await supabaseAdmin
      .from('customers')
      .update({
        name: customerName,
        ...(stripeCustomerId ? { stripe_customer_id: stripeCustomerId } : {}),
        ...(country ? { country } : {}),
        updated_at: new Date().toISOString(),
      })
      .eq('id', existingCustomer.id)
      .select()
      .single();
    if (error) throw new Error(`Failed to update customer: ${error.message}`);
    dbCustomer = data;
  } else {
    const { data, error } = await supabaseAdmin
      .from('customers')
      .insert({
        email: customerEmail,
        name: customerName,
        stripe_customer_id: stripeCustomerId ?? null,
        country: country ?? 'Unknown',
      })
      .select()
      .single();
    if (error) throw new Error(`Failed to create customer: ${error.message}`);
    dbCustomer = data;
  }

  // Payment row
  const { data: payment, error: paymentError } = await supabaseAdmin
    .from('payments')
    .insert({
      customer_id: dbCustomer.id,
      stripe_payment_id: paymentIntent.id,
      stripe_session_id: null,
      amount: paymentIntent.amount / 100,
      currency: paymentIntent.currency,
      status: 'paid',
      product_name: paymentIntent.metadata.productName || PRODUCT_CONFIG.name,
    })
    .select()
    .single();

  if (paymentError) {
    // If two writers raced (cron + frontend), the second one will fail on
    // a unique constraint or just see existing — re-check defensively.
    const { data: raceWinner } = await supabaseAdmin
      .from('payments')
      .select('id')
      .eq('stripe_payment_id', paymentIntent.id)
      .maybeSingle();
    if (raceWinner) {
      return { status: 'already_processed', paymentId: raceWinner.id };
    }
    throw new Error(`Failed to create payment record: ${paymentError.message}`);
  }

  // Magic link
  const { downloadUrl } = await createMagicLink(
    dbCustomer.id,
    payment.id,
    PRODUCT_CONFIG.pdfFileName
  );

  await supabaseAdmin
    .from('payments')
    .update({ magic_link_created: true })
    .eq('id', payment.id);

  // Email
  const emailHtml = getPurchaseEmailTemplate({
    customerName,
    downloadUrl,
    whatsappNumber: WHATSAPP_NUMBER,
  });

  let emailSent = false;
  try {
    const emailResult = await resend.emails.send({
      from: 'Planeta Keto <info@planetaketo.es>',
      to: customerEmail,
      subject: '¡Gracias por tu compra! Tu Método Keto está listo 💚',
      html: emailHtml,
    });

    await supabaseAdmin
      .from('payments')
      .update({ email_sent: true, email_sent_at: new Date().toISOString() })
      .eq('id', payment.id);

    emailSent = true;
    console.log(`✅ Email sent to ${customerEmail} | Resend ID: ${emailResult.data?.id}`);
  } catch (emailError: any) {
    console.error('❌ Email sending failed:', emailError);
    // Don't fail the sale — magic_link_created is true, recovery is possible.
  }

  console.log(
    `🎉 SALE PROCESSED | ${customerEmail} | ` +
    `${payment.amount} ${payment.currency} | ${payment.id}`
  );

  return { status: 'created', paymentId: payment.id, emailSent };
}

/**
 * Best-effort extraction of customer email collected by Stripe Elements.
 * Falls back through receipt_email → charge billing_details → payment_method.
 */
export async function extractStripeEmail(
  paymentIntent: Stripe.PaymentIntent
): Promise<{ email: string | null; name: string | null; country: string | null }> {
  let email: string | null = paymentIntent.receipt_email || null;
  let name: string | null = null;
  let country: string | null = null;

  // Charges (via latest_charge)
  const latestChargeId = (paymentIntent.latest_charge as string) || null;
  if (latestChargeId) {
    try {
      const charge = await stripe.charges.retrieve(latestChargeId);
      email = email || charge.billing_details?.email || null;
      name = charge.billing_details?.name || null;
      country = charge.billing_details?.address?.country || null;
    } catch {}
  }

  // Payment method
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
