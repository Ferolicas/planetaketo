// ============================================================
// Geolocalización por IP (server-side, sin API key).
// El VPS está detrás de Caddy (no Cloudflare), así que NO hay cabecera
// `cf-ipcountry`. Caddy pasa la IP real del cliente en `x-forwarded-for`.
//
// Se usa SOLO para elegir la pasarela por defecto (Colombia → Mercado Pago;
// resto → Stripe). No es una frontera de seguridad: el modal ofrece un toggle
// manual y el webhook es la fuente de verdad del cobro. Por eso, ante cualquier
// duda devolvemos null (el llamador decide el defecto, que es Stripe).
//
// Fuentes (sin key, HTTPS): country.is → ipwho.is. Cache por IP en memoria.
// ============================================================

const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hora
const FETCH_TIMEOUT_MS = 2500;

const ipCache = new Map<string, { country: string | null; at: number }>();

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
  // 172.16.0.0 – 172.31.255.255
  const m = ip.match(/^172\.(\d+)\./);
  if (m) {
    const second = Number(m[1]);
    if (second >= 16 && second <= 31) return true;
  }
  // Rango privado IPv6 (fc00::/7)
  if (/^f[cd][0-9a-f]{2}:/i.test(ip)) return true;
  return false;
}

async function fetchCountry(ip: string): Promise<string | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    // country.is → { ip, country: "CO" }
    const res = await fetch(`https://api.country.is/${ip}`, {
      signal: controller.signal,
      cache: 'no-store',
    });
    if (res.ok) {
      const data = (await res.json()) as { country?: string };
      const code = normalizeCode(data?.country);
      if (code) return code;
    }
  } catch {
    /* probamos el fallback */
  } finally {
    clearTimeout(timer);
  }

  // Fallback: ipwho.is → { country_code: "CO", success: bool }
  const controller2 = new AbortController();
  const timer2 = setTimeout(() => controller2.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(`https://ipwho.is/${ip}?fields=country_code,success`, {
      signal: controller2.signal,
      cache: 'no-store',
    });
    if (res.ok) {
      const data = (await res.json()) as { country_code?: string; success?: boolean };
      if (data?.success !== false) return normalizeCode(data?.country_code);
    }
  } catch {
    /* sin país */
  } finally {
    clearTimeout(timer2);
  }

  return null;
}

function normalizeCode(v: unknown): string | null {
  if (typeof v !== 'string') return null;
  const code = v.trim().toUpperCase();
  return /^[A-Z]{2}$/.test(code) ? code : null;
}

/**
 * Código ISO alpha-2 del país del visitante, o null si no se puede determinar.
 * Cachea por IP. En desarrollo (IP local) devuelve null.
 */
export async function getCountryFromRequest(req: Request): Promise<string | null> {
  const ip = getClientIp(req.headers);
  if (!ip) return null;

  const cached = ipCache.get(ip);
  const now = Date.now();
  if (cached && now - cached.at < CACHE_TTL_MS) return cached.country;

  const country = await fetchCountry(ip);
  ipCache.set(ip, { country, at: now });
  return country;
}
