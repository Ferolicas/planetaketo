import bcrypt from 'bcryptjs';
import { pool, query, queryOne, withTransaction } from '@/lib/db';
import { markSaleCompleted } from '@/lib/analytics/session-link';
import { createMagicLink } from '@/lib/downloads/magic-link';
import { resend } from '@/lib/resend';
import { getPurchaseEmailTemplate } from '@/lib/email/templates';
import { PRODUCT_CONFIG } from '@/lib/product';
import catalog from '@/data/catalog.json';

const WHATSAPP_NUMBER = '+19176726696';
const FROM_EMAIL = 'Planeta Keto <info@planetaketo.es>';
const KETOSCAN_DEFAULT_PASSWORD = 'Cliente1234*';

type CatalogItem = {
  slug: string;
  title: string;
  for?: string;
  note?: string;
  includes?: string[];
};

const CATALOG_ITEMS: CatalogItem[] = [
  ...(catalog.products as CatalogItem[]),
  ...(catalog.bundles as CatalogItem[]),
];

function resolveProduct(
  slug: string | null | undefined,
  fallbackName: string
): { slug: string; name: string; summary: string; isBundle: boolean } {
  const resolvedSlug = slug || 'metodo-keto';
  const item = CATALOG_ITEMS.find((entry) => entry.slug === resolvedSlug);
  if (!item) throw new Error(`Producto de pago no reconocido: ${resolvedSlug}`);
  return {
    slug: item.slug,
    name: item.title || fallbackName,
    summary: item.for || item.note || '',
    isBundle: Boolean(item.includes),
  };
}

export type ProcessSaleResult =
  | { status: 'created'; paymentId: string; emailSent: boolean }
  | { status: 'already_processed'; paymentId: string }
  | { status: 'skipped'; reason: string };

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

export async function ensureKetoscanAccount(email: string): Promise<void> {
  const normalized = email.toLowerCase();
  const existing = await queryOne<{ id: string }>(
    `SELECT id FROM ketoscan_accounts WHERE email = $1`,
    [normalized]
  );
  if (existing) return;
  const hash = await bcrypt.hash(KETOSCAN_DEFAULT_PASSWORD, 10);
  await query(
    `INSERT INTO ketoscan_accounts (email, password_hash, must_change_password)
     VALUES ($1, $2, true)
     ON CONFLICT (email) DO NOTHING`,
    [normalized, hash]
  );
}

export interface FinalizeSaleOpts {
  provider: 'hotmart' | 'stripe' | 'mercadopago';
  externalId: string;
  externalRef?: string | null;
  email: string;
  name: string;
  country?: string | null;
  amount: number;
  currency: string;
  status: string;
  productName: string;
  externalCustomerId?: string | null;
  sessionId?: string | null;
  productSlug?: string | null;
}

interface PaymentDeliveryRow {
  id: string;
  customer_id: string;
  provider: string;
  product_name: string | null;
  product_slug: string | null;
  magic_link_created: boolean;
  email_sent: boolean;
  newsletter_synced: boolean;
  ketoscan_created: boolean;
  email: string;
  name: string;
}

async function registerSale(
  opts: FinalizeSaleOpts,
  email: string
): Promise<{ paymentId: string; created: boolean }> {
  return withTransaction(async (client) => {
    // Serializa carreras tanto por pago como por email sin depender del proceso Node.
    await client.query(`SELECT pg_advisory_xact_lock(hashtextextended($1, 0))`, [
      `payment:${opts.externalId}`,
    ]);
    await client.query(`SELECT pg_advisory_xact_lock(hashtextextended($1, 0))`, [
      `customer:${email}`,
    ]);

    const customerResult = await client.query<{ id: string }>(
      `SELECT id FROM customers WHERE lower(email) = lower($1) LIMIT 1`,
      [email]
    );
    let customerId = customerResult.rows[0]?.id;
    if (customerId) {
      await client.query(
        `UPDATE customers SET
           email = $2,
           name = $3,
           stripe_customer_id = COALESCE($4, stripe_customer_id),
           country = COALESCE($5, country),
           updated_at = now()
         WHERE id = $1`,
        [customerId, email, opts.name, opts.externalCustomerId ?? null, opts.country ?? null]
      );
    } else {
      const createdCustomer = await client.query<{ id: string }>(
        `INSERT INTO customers (email, name, stripe_customer_id, country)
         VALUES ($1, $2, $3, $4) RETURNING id`,
        [email, opts.name, opts.externalCustomerId ?? null, opts.country ?? 'Unknown']
      );
      customerId = createdCustomer.rows[0]?.id;
    }
    if (!customerId) throw new Error('No se pudo crear el cliente');

    const existing = await client.query<{
      id: string;
      provider: string;
      product_slug: string | null;
    }>(
      `SELECT id, provider, product_slug
       FROM payments WHERE stripe_payment_id = $1`,
      [opts.externalId]
    );
    const previous = existing.rows[0];
    if (previous) {
      if (previous.provider !== opts.provider) {
        throw new Error('El ID externo ya pertenece a otra pasarela');
      }
      if (previous.product_slug && opts.productSlug && previous.product_slug !== opts.productSlug) {
        throw new Error('El ID externo ya pertenece a otro producto');
      }
      await client.query(
        `UPDATE payments SET
           stripe_session_id = COALESCE(stripe_session_id, $2),
           product_slug = COALESCE(product_slug, $3),
           product_name = COALESCE(product_name, $4)
         WHERE id = $1`,
        [previous.id, opts.externalRef ?? null, opts.productSlug ?? null, opts.productName]
      );
      return { paymentId: previous.id, created: false };
    }

    const payment = await client.query<{ id: string }>(
      `INSERT INTO payments
         (customer_id, stripe_payment_id, stripe_session_id, amount, currency,
          status, product_name, provider, product_slug, delivery_status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'pending')
       RETURNING id`,
      [
        customerId,
        opts.externalId,
        opts.externalRef ?? null,
        opts.amount,
        opts.currency.toLowerCase(),
        opts.status,
        opts.productName,
        opts.provider,
        opts.productSlug ?? null,
      ]
    );
    const paymentId = payment.rows[0]?.id;
    if (!paymentId) throw new Error('No se pudo registrar el pago');
    return { paymentId, created: true };
  });
}

async function withPaymentDeliveryLock<T>(
  paymentId: string,
  work: () => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query(`SELECT pg_advisory_lock(hashtextextended($1, 0))`, [
      `delivery:${paymentId}`,
    ]);
    return await work();
  } finally {
    try {
      await client.query(`SELECT pg_advisory_unlock(hashtextextended($1, 0))`, [
        `delivery:${paymentId}`,
      ]);
    } finally {
      client.release();
    }
  }
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message.slice(0, 1000) : String(error).slice(0, 1000);
}

/**
 * Completa o repara la entrega de un pago ya registrado. Es seguro llamarla
 * desde varios webhooks y desde el reconciliador periódico.
 */
export async function reconcilePaymentDelivery(paymentId: string): Promise<void> {
  await withPaymentDeliveryLock(paymentId, async () => {
    await query(
      `UPDATE payments SET
         delivery_status = 'processing',
         delivery_attempts = delivery_attempts + 1,
         last_delivery_attempt_at = now(),
         delivery_error = NULL
       WHERE id = $1`,
      [paymentId]
    );

    try {
      const row = await queryOne<PaymentDeliveryRow>(
        `SELECT p.id, p.customer_id, p.provider, p.product_name, p.product_slug,
                COALESCE(p.magic_link_created, false) AS magic_link_created,
                COALESCE(p.email_sent, false) AS email_sent,
                COALESCE(p.newsletter_synced, false) AS newsletter_synced,
                COALESCE(p.ketoscan_created, false) AS ketoscan_created,
                c.email, c.name
         FROM payments p
         JOIN customers c ON c.id = p.customer_id
         WHERE p.id = $1`,
        [paymentId]
      );
      if (!row) throw new Error('Pago no encontrado para reconciliación');

      const product = resolveProduct(row.product_slug, row.product_name || PRODUCT_CONFIG.name);
      const fileName = `${product.name}.${product.isBundle ? 'zip' : 'pdf'}`;
      const { downloadUrl } = await createMagicLink(
        row.customer_id,
        row.id,
        fileName,
        product.slug,
        2
      );
      if (!row.magic_link_created) {
        await query(`UPDATE payments SET magic_link_created = true WHERE id = $1`, [paymentId]);
      }

      if (!row.email_sent) {
        const emailResult = await resend.emails.send(
          {
            from: FROM_EMAIL,
            to: row.email,
            subject: `¡Gracias por tu compra! ${product.name} 💚`,
            html: getPurchaseEmailTemplate({
              customerName: row.name,
              productName: product.name,
              productSummary: product.summary,
              downloadUrl,
              whatsappNumber: WHATSAPP_NUMBER,
            }),
          },
          { idempotencyKey: `purchase-${paymentId}` }
        );
        if (emailResult.error) {
          throw new Error(`Resend: ${emailResult.error.name} - ${emailResult.error.message}`);
        }
        await query(
          `UPDATE payments SET email_sent = true, email_sent_at = now() WHERE id = $1`,
          [paymentId]
        );
      }

      if (!row.newsletter_synced) {
        await upsertNewsletter(row.email, row.name, product.name);
        await query(`UPDATE payments SET newsletter_synced = true WHERE id = $1`, [paymentId]);
      }
      if (!row.ketoscan_created) {
        await ensureKetoscanAccount(row.email);
        await query(`UPDATE payments SET ketoscan_created = true WHERE id = $1`, [paymentId]);
      }

      await query(
        `UPDATE payments SET
           delivery_status = 'completed',
           delivery_error = NULL,
           fulfillment_completed_at = COALESCE(fulfillment_completed_at, now())
         WHERE id = $1`,
        [paymentId]
      );
      console.log(`[delivery] completada | provider=${row.provider} | payment=${paymentId}`);
    } catch (error) {
      await query(
        `UPDATE payments SET delivery_status = 'retry_pending', delivery_error = $2 WHERE id = $1`,
        [paymentId, errorMessage(error)]
      ).catch(() => undefined);
      throw error;
    }
  });
}

export async function reconcilePendingDeliveries(limit = 50): Promise<{
  inspected: number;
  completed: number;
  failed: number;
}> {
  const result = await query<{ id: string }>(
    `SELECT id
     FROM payments
     WHERE status IN ('paid', 'approved', 'succeeded')
       AND (
         delivery_status <> 'completed'
         OR COALESCE(magic_link_created, false) = false
         OR COALESCE(email_sent, false) = false
         OR COALESCE(newsletter_synced, false) = false
         OR COALESCE(ketoscan_created, false) = false
       )
       AND (
         last_delivery_attempt_at IS NULL
         OR last_delivery_attempt_at < now() - interval '2 minutes'
       )
     ORDER BY created_at ASC
     LIMIT $1`,
    [Math.max(1, Math.min(limit, 200))]
  );
  let completed = 0;
  let failed = 0;
  for (const payment of result.rows) {
    try {
      await reconcilePaymentDelivery(payment.id);
      completed += 1;
    } catch (error) {
      failed += 1;
      console.error(`[delivery] reintento falló | payment=${payment.id}`, errorMessage(error));
    }
  }
  return { inspected: result.rows.length, completed, failed };
}

export async function finalizeSale(opts: FinalizeSaleOpts): Promise<ProcessSaleResult> {
  const email = opts.email?.trim().toLowerCase();
  // Un pago confirmado nunca se acusa como procesado si falta el dato que
  // permite entregarlo. El 5xx del webhook fuerza el reintento y deja evidencia.
  if (!email) throw new Error(`${opts.provider} confirmó el pago sin email del comprador`);
  // Rechaza slugs desconocidos antes de persistir o entregar cualquier cosa.
  resolveProduct(opts.productSlug, opts.productName);

  const registration = await registerSale(opts, email);
  await reconcilePaymentDelivery(registration.paymentId);

  await markSaleCompleted(opts.sessionId).catch((error) => {
    console.error('[analytics] no se pudo marcar la venta:', errorMessage(error));
  });

  if (!registration.created) {
    return { status: 'already_processed', paymentId: registration.paymentId };
  }
  return { status: 'created', paymentId: registration.paymentId, emailSent: true };
}
