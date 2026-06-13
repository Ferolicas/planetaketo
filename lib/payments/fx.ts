// ============================================================
// Conversión EUR → COP en tiempo real (sin API key).
// La cuenta de Mercado Pago es de Colombia y cobra en pesos (COP), así que el
// comprador colombiano paga SIEMPRE el equivalente actual del precio en euros.
//
// Cadena de obtención de la tasa (primera que responda gana):
//   1) open.er-api.com           (ExchangeRate-API, endpoint abierto, cubre COP)
//   2) @fawazahmed0/currency-api  (CDN jsDelivr)
//   3) espejo currency-api.pages.dev
//   4) suelo fijo FX_EUR_COP_FALLBACK (para no bloquear NUNCA una venta)
//
// La tasa se cachea en memoria ~6 h. COP no tiene decimales: redondeamos a la
// centena más cercana para precios "limpios".
// ============================================================

const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 horas
const FETCH_TIMEOUT_MS = 4000;

// Suelo defensivo si TODAS las fuentes fallan. Configurable por entorno.
function fallbackRate(): number {
  const env = Number(process.env.FX_EUR_COP_FALLBACK);
  return Number.isFinite(env) && env > 0 ? env : 4000;
}

interface CachedRate {
  rate: number;
  fetchedAt: number;
  source: string;
}

let cache: CachedRate | null = null;

async function fetchJson(url: string): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      // Nunca cachear a nivel de Next: gestionamos el cache nosotros.
      cache: 'no-store',
      headers: { accept: 'application/json' },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

function asValidRate(v: unknown): number | null {
  const n = Number(v);
  // Cota de cordura: COP/EUR ronda los miles; descartamos valores absurdos.
  return Number.isFinite(n) && n > 500 && n < 100_000 ? n : null;
}

type Source = { name: string; get: () => Promise<number | null> };

const SOURCES: Source[] = [
  {
    name: 'open.er-api.com',
    get: async () => {
      const data = (await fetchJson('https://open.er-api.com/v6/latest/EUR')) as {
        result?: string;
        rates?: Record<string, number>;
      };
      if (data?.result !== 'success') return null;
      return asValidRate(data?.rates?.COP);
    },
  },
  {
    name: 'fawazahmed0/jsdelivr',
    get: async () => {
      const data = (await fetchJson(
        'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/eur.json'
      )) as { eur?: Record<string, number> };
      return asValidRate(data?.eur?.cop);
    },
  },
  {
    name: 'currency-api.pages.dev',
    get: async () => {
      const data = (await fetchJson(
        'https://latest.currency-api.pages.dev/v1/currencies/eur.json'
      )) as { eur?: Record<string, number> };
      return asValidRate(data?.eur?.cop);
    },
  },
];

/**
 * Tasa EUR→COP vigente. Usa cache en memoria; si caduca, intenta las fuentes en
 * orden. Si todas fallan y hay cache viejo, devuelve el viejo; si no, el suelo.
 */
export async function getEurToCop(): Promise<number> {
  const now = Date.now();
  if (cache && now - cache.fetchedAt < CACHE_TTL_MS) {
    return cache.rate;
  }

  for (const source of SOURCES) {
    try {
      const rate = await source.get();
      if (rate) {
        cache = { rate, fetchedAt: now, source: source.name };
        return rate;
      }
    } catch (err) {
      console.warn(`[fx] fuente ${source.name} falló:`, (err as Error)?.message);
    }
  }

  // Todas fallaron: cache viejo (mejor que nada) o suelo fijo.
  if (cache) {
    console.warn(`[fx] usando tasa cacheada antigua (${cache.source}) por fallo de todas las fuentes`);
    return cache.rate;
  }
  const floor = fallbackRate();
  console.error(`[fx] sin tasa en vivo ni cache; usando suelo fijo ${floor}`);
  return floor;
}

/** Convierte un importe en EUR a COP entero, redondeado a la centena. */
export function eurToCop(eur: number, rate: number): number {
  const raw = eur * rate;
  return Math.max(0, Math.round(raw / 100) * 100);
}

/** Helper: convierte y devuelve también la tasa usada (para mostrar/depurar). */
export async function convertEurToCop(eur: number): Promise<{ cop: number; rate: number }> {
  const rate = await getEurToCop();
  return { cop: eurToCop(eur, rate), rate };
}
