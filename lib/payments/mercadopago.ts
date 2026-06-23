import { MercadoPagoConfig, Payment } from 'mercadopago';
import { finalizeSale, type ProcessSaleResult } from '@/lib/payments/process-sale';
import { PRODUCT_CONFIG } from '@/lib/product';

// ============================================================
// Cliente de Mercado Pago (server-side). Cobro para COLOMBIA (COP).
// La cuenta es de Colombia (site MCO): cobra en pesos colombianos.
// El resto del mundo va por Stripe (ver lib/payments/stripe.ts).
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
  external_reference?: string;
  metadata?: Record<string, unknown>;
  payer?: { email?: string; first_name?: string; last_name?: string };
  point_of_interaction?: { transaction_data?: { ticket_url?: string } };
  transaction_details?: { external_resource_url?: string };
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

  const email = payment.payer?.email?.trim() ?? '';
  const name =
    [payment.payer?.first_name, payment.payer?.last_name].filter(Boolean).join(' ').trim() ||
    'Cliente';

  const sessionId =
    typeof payment.metadata?.session_uuid === 'string' ? payment.metadata.session_uuid : null;
  const productSlug =
    typeof payment.metadata?.product_slug === 'string' ? payment.metadata.product_slug : null;
  const productName =
    typeof payment.metadata?.product_name === 'string'
      ? payment.metadata.product_name
      : PRODUCT_CONFIG.name;

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
    productName,
    externalCustomerId: null,
    sessionId,
    productSlug,
  });
}
