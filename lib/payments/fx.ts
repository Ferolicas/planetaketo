// ============================================================
// Conversión de divisas EUR → cualquier moneda, en tiempo real y sin API key.
// El precio base del producto está en EUR; se muestra y se cobra en la moneda
// local del visitante (detectada por geo). Colombia cobra en COP por Mercado
// Pago; el resto, en su moneda local por Stripe.
//
// Fuente de tasas (primera que responda): open.er-api.com → @fawazahmed0 (CDN).
// Se cachea el set COMPLETO de tasas EUR→* en memoria (~6 h).
// ============================================================

const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 horas
const FETCH_TIMEOUT_MS = 4000;

function fallbackCopRate(): number {
  const env = Number(process.env.FX_EUR_COP_FALLBACK);
  return Number.isFinite(env) && env > 0 ? env : 4000;
}

let ratesCache: { rates: Record<string, number>; at: number } | null = null;

async function fetchJson(url: string): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      cache: 'no-store',
      headers: { accept: 'application/json' },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

async function fetchEurRates(): Promise<Record<string, number> | null> {
  // 1) open.er-api.com → { result:'success', rates: { USD:..., COP:... } }
  try {
    const data = (await fetchJson('https://open.er-api.com/v6/latest/EUR')) as {
      result?: string;
      rates?: Record<string, number>;
    };
    if (data?.result === 'success' && data.rates && Object.keys(data.rates).length > 10) {
      return data.rates;
    }
  } catch {
    /* probamos el fallback */
  }

  // 2) @fawazahmed0/currency-api (CDN) → { eur: { usd:..., cop:... } } (claves minúsculas)
  for (const url of [
    'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/eur.json',
    'https://latest.currency-api.pages.dev/v1/currencies/eur.json',
  ]) {
    try {
      const data = (await fetchJson(url)) as { eur?: Record<string, number> };
      if (data?.eur && Object.keys(data.eur).length > 10) {
        const rates: Record<string, number> = {};
        for (const [k, v] of Object.entries(data.eur)) rates[k.toUpperCase()] = v;
        return rates;
      }
    } catch {
      /* siguiente fuente */
    }
  }
  return null;
}

/** Todas las tasas EUR→* vigentes (cacheadas). {} si todo falla y no hay cache. */
export async function getEurRates(): Promise<Record<string, number>> {
  const now = Date.now();
  if (ratesCache && now - ratesCache.at < CACHE_TTL_MS) return ratesCache.rates;

  const rates = await fetchEurRates();
  if (rates) {
    ratesCache = { rates, at: now };
    return rates;
  }
  if (ratesCache) {
    console.warn('[fx] usando tasas cacheadas antiguas (fallaron todas las fuentes)');
    return ratesCache.rates;
  }
  console.error('[fx] sin tasas en vivo ni cache');
  return {};
}

/**
 * Convierte un importe en EUR a `currency`. Devuelve { amount, rate } o null si
 * la moneda no está disponible en las tasas. EUR→EUR es identidad.
 */
export async function convertEur(
  eur: number,
  currency: string
): Promise<{ amount: number; rate: number } | null> {
  const cur = String(currency || '').toUpperCase();
  if (!cur) return null;
  if (cur === 'EUR') return { amount: eur, rate: 1 };

  const rates = await getEurRates();
  const rate = rates[cur];
  if (!rate || !(rate > 0)) return null;
  return { amount: eur * rate, rate };
}

/**
 * Conversión EUR→COP para Mercado Pago (Colombia). Redondea a la centena (COP no
 * usa decimales). Usa un suelo fijo si la conversión no está disponible, para no
 * bloquear NUNCA una venta.
 */
export async function convertEurToCop(eur: number): Promise<{ cop: number; rate: number }> {
  const conv = await convertEur(eur, 'COP');
  const rate = conv?.rate ?? fallbackCopRate();
  const amount = conv?.amount ?? eur * rate;
  return { cop: Math.max(0, Math.round(amount / 100) * 100), rate };
}
