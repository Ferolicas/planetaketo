import crypto from 'crypto';
import { z } from 'zod';
import { PRODUCT_CONFIG } from '@/lib/product';

// ============================================================
// Lógica pura del webhook de Hotmart (sin I/O), para poder testearla.
// El route handler (app/api/hotmart/webhook) la usa y le añade DB + respuestas.
// ============================================================

// Solo estos eventos disparan la entrega del producto.
export const APPROVED_EVENTS = new Set(['PURCHASE_APPROVED', 'PURCHASE_COMPLETE']);

/** Comparación en tiempo constante del hottok recibido contra el esperado. */
export function verifyHottok(provided: string, expected: string): boolean {
  if (!provided || !expected) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

/** El hottok puede venir en la cabecera (2.0) o en el body (pruebas/v1). */
export function pickHottok(headerTok: string | null | undefined, payload: any): string {
  if (headerTok) return headerTok;
  if (payload && typeof payload.hottok === 'string') return payload.hottok;
  return '';
}

const SaleSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  transaction: z.string().min(1),
  amount: z.number().nonnegative(),
  currency: z.string().min(1),
});

export interface HotmartSale {
  email: string;
  name: string;
  transaction: string;
  amount: number;
  currency: string;
  country: string | null;
  productName: string;
  eventId: string | null;
}

export type ParseResult =
  | { ok: true; sale: HotmartSale }
  | { ok: false; reason: 'ignored_event' | 'other_product' | 'missing_fields'; event?: string };

/**
 * Extrae y valida (Zod) los campos que necesitamos del payload 2.0 de Hotmart.
 * Tolerante a variaciones de forma del payload.
 */
export function parseHotmartSale(
  payload: any,
  opts?: { expectedProductId?: string | null }
): ParseResult {
  const event = String(payload?.event ?? '').toUpperCase();
  if (!APPROVED_EVENTS.has(event)) {
    return { ok: false, reason: 'ignored_event', event: event || 'unknown' };
  }

  const data = payload?.data ?? {};
  const buyer = data.buyer ?? {};
  const purchase = data.purchase ?? {};
  const product = data.product ?? {};
  const price = purchase.price ?? purchase.full_price ?? {};

  if (opts?.expectedProductId && String(product.id ?? '') !== String(opts.expectedProductId)) {
    return { ok: false, reason: 'other_product' };
  }

  const countryRaw =
    buyer?.address?.country ??
    data?.checkout_country?.iso ??
    data?.checkout_country ??
    null;

  const extracted = {
    email: String(buyer.email ?? '').trim(),
    name: String(buyer.name ?? buyer.first_name ?? 'Cliente').trim() || 'Cliente',
    transaction: String(purchase.transaction ?? data.transaction ?? payload?.id ?? '').trim(),
    amount: Number(price.value ?? price.amount ?? purchase.value ?? 0) || 0,
    currency: String(
      price.currency_value ?? price.currency_code ?? purchase.currency ?? 'EUR'
    ).toLowerCase(),
  };

  const parsed = SaleSchema.safeParse(extracted);
  if (!parsed.success) {
    return { ok: false, reason: 'missing_fields' };
  }

  return {
    ok: true,
    sale: {
      ...parsed.data,
      country: typeof countryRaw === 'string' ? countryRaw : null,
      productName: String(product.name ?? PRODUCT_CONFIG.name),
      eventId: payload?.id ? String(payload.id) : null,
    },
  };
}
