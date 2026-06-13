import Stripe from 'stripe';

// ============================================================
// Cliente de Stripe (server-side). Cobro para el RESTO DEL MUNDO (EUR).
// Colombia va por Mercado Pago (ver lib/payments/mercadopago.ts).
//
// Inicialización perezosa: NO construimos el cliente en import-time (Next importa
// las rutas durante el build y la clave puede no estar presente entonces). Se
// construye en la primera llamada en runtime; las rutas comprueban
// isStripeConfigured() antes. Sin apiVersion explícita: usamos la fijada por el
// SDK para evitar desajustes de tipos en cada actualización.
// ============================================================

let _stripe: Stripe | null = null;

export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

export function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error('STRIPE_SECRET_KEY no configurada');
    _stripe = new Stripe(key, {
      appInfo: { name: 'Planeta Keto', url: 'https://planetaketo.es' },
    });
  }
  return _stripe;
}

// ── Monedas ─────────────────────────────────────────────────────────────────
// Monedas SIN decimales en Stripe: el `amount` NO se multiplica por 100.
const ZERO_DECIMAL = new Set([
  'BIF', 'CLP', 'DJF', 'GNF', 'JPY', 'KMF', 'KRW', 'MGA',
  'PYG', 'RWF', 'UGX', 'VND', 'VUV', 'XAF', 'XOF', 'XPF',
]);

export function isZeroDecimal(currency: string): boolean {
  return ZERO_DECIMAL.has(currency.toUpperCase());
}

/** Importe (en unidades mayores) → entero que espera Stripe según la moneda. */
export function toStripeAmount(amount: number, currency: string): number {
  return isZeroDecimal(currency)
    ? Math.max(0, Math.round(amount))
    : Math.max(0, Math.round(amount * 100));
}

// Monedas que la cuenta puede cobrar (presentment). Cacheado 24 h.
const ACCOUNT_COUNTRY = process.env.STRIPE_ACCOUNT_COUNTRY || 'ES';
let supportedCache: { set: Set<string>; at: number } | null = null;

export async function stripeSupportedCurrencies(): Promise<Set<string>> {
  const now = Date.now();
  if (supportedCache && now - supportedCache.at < 24 * 60 * 60 * 1000) return supportedCache.set;
  try {
    const spec = await getStripe().countrySpecs.retrieve(ACCOUNT_COUNTRY);
    const set = new Set((spec.supported_payment_currencies || []).map((c) => c.toUpperCase()));
    if (set.size > 0) {
      supportedCache = { set, at: now };
      return set;
    }
  } catch (e) {
    console.warn('[stripe] no se pudieron leer monedas soportadas:', (e as Error).message);
  }
  return supportedCache?.set ?? new Set(['EUR', 'USD']);
}
