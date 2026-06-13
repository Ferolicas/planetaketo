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
