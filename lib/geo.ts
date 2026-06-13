// ============================================================
// Geolocalización por IP (server-side, sin API key).
// Devuelve el país Y la moneda local del visitante para:
//   - elegir la pasarela (Colombia → Mercado Pago; resto → Stripe), y
//   - mostrar/cobrar el precio en la moneda local de cada país.
//
// El VPS está detrás de Caddy (no Cloudflare): la IP del cliente viaja en
// `x-forwarded-for`. Fuente: ipapi.co (da country_code + currency en una llamada,
// para CUALQUIER país, sin tablas que mantener) → fallback country.is (solo país).
// Cache por IP. No es frontera de seguridad: el webhook es la fuente de verdad.
// ============================================================

import { currencyForCountry } from './payments/country-currency';

const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hora
const FETCH_TIMEOUT_MS = 2500;

export interface Geo {
  country: string | null; // ISO 3166 alpha-2 (p.ej. 'PE')
  currency: string | null; // ISO 4217 (p.ej. 'PEN')
}

const geoCache = new Map<string, { geo: Geo; at: number }>();

/** Primera IP pública de x-forwarded-for (o x-real-ip). Ignora privadas/locales. */
export function getClientIp(headers: Headers): string | null {
  const xff = headers.get('x-forwarded-for');
  const candidates = (xff ? xff.split(',') : [])
    .map((s) => s.trim())
    .concat([headers.get('x-real-ip')?.trim() ?? '']);
  for (const ip of candidates) {
    if (ip && !isPrivateIp(ip)) return ip;
  }
  return null;
}

function isPrivateIp(ip: string): boolean {
  if (ip === '::1' || ip.startsWith('127.') || ip.toLowerCase() === 'localhost') return true;
  if (ip.startsWith('10.') || ip.startsWith('192.168.')) return true;
  const m = ip.match(/^172\.(\d+)\./);
  if (m) {
    const second = Number(m[1]);
    if (second >= 16 && second <= 31) return true;
  }
  if (/^f[cd][0-9a-f]{2}:/i.test(ip)) return true;
  return false;
}

function cc(v: unknown): string | null {
  if (typeof v !== 'string') return null;
  const c = v.trim().toUpperCase();
  return /^[A-Z]{2}$/.test(c) ? c : null;
}

async function fetchJson(url: string, timeoutMs = FETCH_TIMEOUT_MS): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal, cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

async function fetchGeo(ip: string): Promise<Geo> {
  let country: string | null = null;

  // País por IP: country.is (rápido y sin el rate limit de ipapi.co).
  try {
    const data = (await fetchJson(`https://api.country.is/${ip}`)) as { country?: string };
    country = cc(data?.country);
  } catch {
    /* probamos el fallback */
  }
  // Fallback de país: ipwho.is.
  if (!country) {
    try {
      const data = (await fetchJson(`https://ipwho.is/${ip}?fields=country_code,success`)) as {
        country_code?: string;
        success?: boolean;
      };
      if (data?.success !== false) country = cc(data?.country_code);
    } catch {
      /* sin país */
    }
  }

  // La moneda se deriva del país con la tabla ISO (sin APIs frágiles).
  return { country, currency: currencyForCountry(country) };
}

/** País + moneda local del visitante (cacheado por IP). En local/dev → nulls. */
export async function getGeoFromRequest(req: Request): Promise<Geo> {
  const ip = getClientIp(req.headers);
  if (!ip) return { country: null, currency: null };

  const cached = geoCache.get(ip);
  const now = Date.now();
  if (cached && now - cached.at < CACHE_TTL_MS) return cached.geo;

  const geo = await fetchGeo(ip);
  geoCache.set(ip, { geo, at: now });
  return geo;
}
