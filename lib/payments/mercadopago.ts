import { MercadoPagoConfig, Payment } from 'mercadopago';
import { finalizeSale, type ProcessSaleResult } from '@/lib/payments/process-sale';
import { queryOne } from '@/lib/db';
import catalog from '@/data/catalog.json';

// ============================================================
// Cliente de Mercado Pago (server-side). Cobro para COLOMBIA (COP).
// La cuenta es de Colombia (site MCO): cobra en pesos colombianos.
// Europa va por Stripe y el resto por Hotmart.
//
// No lanzamos en import-time: las rutas comprueban isMpConfigured() antes de usar.
// ============================================================

export function isMpConfigured(): boolean {
  return Boolean(process.env.MP_ACCESS_TOKEN);
}

function mpClient(): MercadoPagoConfig {
  const accessToken = process.env.MP_ACCESS_TOKEN;
  if (!accessToken) throw new Error('MP_ACCESS_TOKEN no configurado');
  return new MercadoPagoConfig({ accessToken });
}

export function mpPayment(): Payment {
  return new Payment(mpClient());
}

export const MP_INTEGRATION_ID = 'planetaketo';
export const MP_DEFAULT_PRODUCT_SLUG = 'metodo-keto';
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const MP_PRODUCTS = new Map(
  [
    ...(catalog.products as { slug: string; title: string }[]),
    ...(catalog.bundles as { slug: string; title: string }[]),
  ].map((item) => [item.slug, item])
);

// Tipo del body de Payment.create derivado del SDK (sin imports de subpaths).
type MpPaymentBody = Parameters<Payment['create']>[0]['body'];

/**
 * Crea un pago en MP a partir del formData del Payment Brick. Se pasa el formData
 * casi tal cual (cada método —tarjeta, PSE, Nequi, Efecty— trae su propia forma),
 * y el llamador sobreescribe lo que controla el servidor (importe, refs, webhook).
 * El cast cruza la frontera JSON→SDK en un único sitio controlado.
 */
export async function createMpPayment(body: Record<string, unknown>, idempotencyKey: string) {
  return mpPayment().create({
    body: body as unknown as MpPaymentBody,
    requestOptions: { idempotencyKey },
  });
}

/** Subconjunto estructural del PaymentResponse de MP que consumimos. */
export interface MpPayment {
  id?: string | number;
  status?: string;
  status_detail?: string;
  transaction_amount?: number;
  currency_id?: string;
  live_mode?: boolean;
  date_created?: string;
  external_reference?: string;
  metadata?: Record<string, unknown>;
  payer?: { email?: string; first_name?: string; last_name?: string };
  point_of_interaction?: { transaction_data?: { ticket_url?: string } };
  transaction_details?: { external_resource_url?: string };
}

type MpProvenance =
  | { ok: true; productSlug: string; productName: string }
  | { ok: false; reason: string };

/**
 * Demuestra que el pago fue creado por este checkout y que no se manipuló el
 * producto o el importe. Es obligatorio porque la misma cuenta de Mercado Pago
 * puede recibir notificaciones de otras aplicaciones.
 */
export function verifyMpPaymentProvenance(payment: MpPayment): MpProvenance {
  if (payment.metadata?.integration !== MP_INTEGRATION_ID) {
    return { ok: false, reason: 'wrong_integration' };
  }
  if (payment.live_mode !== true) return { ok: false, reason: 'not_live' };
  if (!payment.id) return { ok: false, reason: 'missing_id' };
  if (!payment.external_reference || !UUID_RE.test(payment.external_reference)) {
    return { ok: false, reason: 'invalid_reference' };
  }
  if (String(payment.currency_id || '').toUpperCase() !== 'COP') {
    return { ok: false, reason: 'wrong_currency' };
  }

  const productSlug =
    typeof payment.metadata?.product_slug === 'string'
      ? payment.metadata.product_slug
      : '';
  const product = MP_PRODUCTS.get(productSlug);
  if (!product) return { ok: false, reason: 'unknown_product' };

  const expectedAmount = Number(payment.metadata?.expected_amount_cop);
  const paidAmount = Number(payment.transaction_amount);
  if (
    !Number.isSafeInteger(expectedAmount) ||
    expectedAmount <= 0 ||
    !Number.isSafeInteger(paidAmount) ||
    paidAmount !== expectedAmount
  ) {
    return { ok: false, reason: 'amount_mismatch' };
  }

  return { ok: true, productSlug, productName: product.title };
}

/** URL para completar el pago fuera del sitio (PSE/Efecty), si el método la requiere. */
export function mpRedirectUrl(payment: MpPayment): string | null {
  return (
    payment.point_of_interaction?.transaction_data?.ticket_url ||
    payment.transaction_details?.external_resource_url ||
    null
  );
}

/**
 * Entrega del libro a partir de un pago de MP. Solo si está `approved`.
 * Idempotente (finalizeSale lo es por id externo del pago), así que pueden
 * llamarla a la vez la ruta /pay (entrega inmediata) y el webhook (fuente de verdad).
 */
export async function finalizeMpPayment(payment: MpPayment): Promise<ProcessSaleResult> {
  if (payment.status !== 'approved') {
    return { status: 'skipped', reason: `mp_status_${payment.status ?? 'unknown'}` };
  }

  const provenance = verifyMpPaymentProvenance(payment);
  if (!provenance.ok) {
    return { status: 'skipped', reason: `mp_untrusted_${provenance.reason}` };
  }

  const email = payment.payer?.email?.trim() ?? '';
  const name =
    [payment.payer?.first_name, payment.payer?.last_name].filter(Boolean).join(' ').trim() ||
    'Cliente';

  const sessionId =
    typeof payment.metadata?.session_uuid === 'string' ? payment.metadata.session_uuid : null;

  return finalizeSale({
    provider: 'mercadopago',
    externalId: String(payment.id),
    externalRef: payment.external_reference ?? null,
    email,
    name,
    country: 'CO',
    amount: payment.transaction_amount ?? 0,
    currency: (payment.currency_id ?? 'COP').toLowerCase(),
    status: 'paid',
    productName: provenance.productName,
    externalCustomerId: null,
    sessionId,
    productSlug: provenance.productSlug,
  });
}

export interface MpDiscoveryResult {
  inspected: number;
  eligible: number;
  recovered: number;
  failed: number;
}

/**
 * Red de seguridad independiente del webhook: el cron busca pagos aprobados
 * recientes en la cuenta, descarta todos los que no pertenezcan a Planeta Keto
 * y recupera los que todavía no existen en nuestra tabla de ventas.
 */
export async function reconcileApprovedMpPayments(
  lookbackDays = 14,
  maxPages = 10
): Promise<MpDiscoveryResult> {
  const result: MpDiscoveryResult = { inspected: 0, eligible: 0, recovered: 0, failed: 0 };
  if (!isMpConfigured()) return result;

  const client = mpPayment();
  const limit = 100;
  const begin = new Date(Date.now() - Math.max(1, lookbackDays) * 86_400_000).toISOString();
  const end = new Date().toISOString();

  for (let page = 0; page < Math.max(1, maxPages); page += 1) {
    const response = await client.search({
      options: {
        status: 'approved',
        range: 'date_created',
        begin_date: begin,
        end_date: end,
        sort: 'date_created',
        criteria: 'desc',
        limit,
        offset: page * limit,
      },
    });
    const payments = (response.results ?? []) as MpPayment[];
    result.inspected += payments.length;

    for (const summary of payments) {
      if (!verifyMpPaymentProvenance(summary).ok) continue;
      result.eligible += 1;

      const alreadyRecorded = await queryOne<{ id: string }>(
        `SELECT id FROM payments WHERE stripe_payment_id = $1 AND provider = 'mercadopago'`,
        [String(summary.id)]
      );
      if (alreadyRecorded) continue;

      try {
        const fullPayment = (await client.get({ id: String(summary.id) })) as MpPayment;
        const finalized = await finalizeMpPayment(fullPayment);
        if (finalized.status === 'created' || finalized.status === 'already_processed') {
          result.recovered += 1;
        }
      } catch (error) {
        result.failed += 1;
        console.error('[mercadopago] reconciliación de pago aprobada falló:', {
          paymentId: String(summary.id),
          message: error instanceof Error ? error.message : String(error),
        });
      }
    }

    if (payments.length < limit) break;
  }

  return result;
}
