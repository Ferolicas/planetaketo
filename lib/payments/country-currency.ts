// ============================================================
// Mapa estándar país (ISO 3166-1 alpha-2) → moneda (ISO 4217).
// Se usa para mostrar/cobrar en la moneda local del visitante SIN depender de
// una API de geo-moneda con rate limit (ipapi.co devolvía 429). El país se
// detecta por IP (country.is) y aquí se deriva su moneda, al instante.
//
// Países dolarizados (Ecuador, Panamá, El Salvador, Venezuela de facto…) → USD.
// Eurozona → EUR. Países no listados → el llamador usa EUR como defecto seguro.
// ============================================================

export const COUNTRY_TO_CURRENCY: Record<string, string> = {
  // ── Latinoamérica (prioridad) ──
  AR: 'ARS', BO: 'BOB', BR: 'BRL', CL: 'CLP', CO: 'COP', CR: 'CRC',
  CU: 'CUP', DO: 'DOP', EC: 'USD', SV: 'USD', GT: 'GTQ', HN: 'HNL',
  MX: 'MXN', NI: 'NIO', PA: 'USD', PY: 'PYG', PE: 'PEN', PR: 'USD',
  UY: 'UYU', VE: 'USD',

  // ── Eurozona ──
  AD: 'EUR', AT: 'EUR', BE: 'EUR', CY: 'EUR', DE: 'EUR', EE: 'EUR',
  ES: 'EUR', FI: 'EUR', FR: 'EUR', GR: 'EUR', HR: 'EUR', IE: 'EUR',
  IT: 'EUR', LT: 'EUR', LU: 'EUR', LV: 'EUR', MC: 'EUR', ME: 'EUR',
  MT: 'EUR', NL: 'EUR', PT: 'EUR', SI: 'EUR', SK: 'EUR', SM: 'EUR',
  VA: 'EUR', XK: 'EUR',

  // ── Resto de Europa ──
  GB: 'GBP', CH: 'CHF', SE: 'SEK', NO: 'NOK', DK: 'DKK', PL: 'PLN',
  CZ: 'CZK', HU: 'HUF', RO: 'RON', BG: 'BGN', IS: 'ISK', UA: 'UAH',
  RS: 'RSD', BA: 'BAM', MK: 'MKD', AL: 'ALL', MD: 'MDL', BY: 'BYN',
  RU: 'RUB', TR: 'TRY', GE: 'GEL', AM: 'AMD', AZ: 'AZN',

  // ── Norteamérica ──
  US: 'USD', CA: 'CAD',

  // ── Asia ──
  JP: 'JPY', CN: 'CNY', IN: 'INR', KR: 'KRW', ID: 'IDR', TH: 'THB',
  VN: 'VND', PH: 'PHP', MY: 'MYR', SG: 'SGD', HK: 'HKD', TW: 'TWD',
  PK: 'PKR', BD: 'BDT', LK: 'LKR', NP: 'NPR', KZ: 'KZT', UZ: 'UZS',
  IL: 'ILS', SA: 'SAR', AE: 'AED', QA: 'QAR', KW: 'KWD', BH: 'BHD',
  OM: 'OMR', JO: 'JOD', LB: 'LBP', IQ: 'IQD', IR: 'IRR',

  // ── Oceanía ──
  AU: 'AUD', NZ: 'NZD',

  // ── África ──
  ZA: 'ZAR', EG: 'EGP', MA: 'MAD', DZ: 'DZD', TN: 'TND', NG: 'NGN',
  KE: 'KES', GH: 'GHS', ET: 'ETB', UG: 'UGX', TZ: 'TZS', AO: 'AOA',
};

/** Moneda ISO 4217 del país (alpha-2), o null si no está mapeado. */
export function currencyForCountry(cc: string | null | undefined): string | null {
  if (!cc) return null;
  return COUNTRY_TO_CURRENCY[cc.toUpperCase()] ?? null;
}

// ============================================================
// Enrutado de cobro por país:
//   Colombia (CO)        → Mercado Pago (PSE/Nequi nativos, ~3-4%)
//   Resto de LATAM       → Hotmart (métodos locales: Yape, SPEI, OXXO, PIX…)
//   Resto del mundo      → Stripe (tarjeta/wallets en moneda local)
// ============================================================
export const LATAM_COUNTRIES = new Set([
  'AR', 'BO', 'BR', 'CL', 'CO', 'CR', 'CU', 'DO', 'EC', 'GT',
  'HN', 'MX', 'NI', 'PA', 'PY', 'PE', 'PR', 'SV', 'UY', 'VE',
]);

export function isLatamCountry(cc: string | null | undefined): boolean {
  return cc ? LATAM_COUNTRIES.has(cc.toUpperCase()) : false;
}

// ============================================================
// Spread cambial de Hotmart POR PAÍS (su tasa de cambio vs el mercado real).
// Hotmart no lo publica; se MIDE comparando su checkout con nuestra conversión
// mid-market. Las monedas volátiles/controladas (ARS) tienen un spread mucho
// mayor que las estables. Lo usamos para que el precio mostrado en la web cuadre
// con el del checkout de Hotmart. Calibrar con datos reales de cada país.
//   AR: medido (web 17.280 vs checkout 18.200 → ~14%).
//   Resto: estimado (pendiente de medir con VPN) — erramos ligeramente ALTO para
//   que la web nunca muestre MENOS que el checkout (el cliente nunca paga "de más").
// ============================================================
const HOTMART_SPREAD: Record<string, number> = {
  AR: 0.14,
  CL: 0.11,
  MX: 0.11,
  UY: 0.11,
  PE: 0.08,
  BR: 0.08,
};
const HOTMART_SPREAD_DEFAULT = 0.1;

export function hotmartSpread(cc: string | null | undefined): number {
  if (!cc) return HOTMART_SPREAD_DEFAULT;
  return HOTMART_SPREAD[cc.toUpperCase()] ?? HOTMART_SPREAD_DEFAULT;
}
