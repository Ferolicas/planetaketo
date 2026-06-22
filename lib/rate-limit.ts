import { NextResponse } from 'next/server';

// ============================================================
// Rate limiter en memoria (ventana deslizante). Single-VPS + PM2 (1 instancia):
// suficiente contra fuerza bruta y abuso. Si se escala a varias instancias,
// migrar a Redis (hay Redis en el VPS) o @upstash/ratelimit.
// ============================================================

declare global {
  // eslint-disable-next-line no-var
  var __pkRateStore: Map<string, number[]> | undefined;
}

const store: Map<string, number[]> = global.__pkRateStore ?? new Map();
global.__pkRateStore = store;

export interface RateResult {
  success: boolean;
  remaining: number;
  resetMs: number;
}

export function rateLimit(key: string, limit: number, windowMs: number): RateResult {
  const now = Date.now();
  const windowStart = now - windowMs;
  const hits = (store.get(key) ?? []).filter((t) => t > windowStart);

  if (hits.length >= limit) {
    store.set(key, hits);
    return { success: false, remaining: 0, resetMs: Math.max(0, hits[0] + windowMs - now) };
  }

  hits.push(now);
  store.set(key, hits);

  // Limpieza ocasional para no crecer sin límite.
  if (store.size > 5000) {
    for (const [k, v] of store) {
      const fresh = v.filter((t) => t > windowStart);
      if (fresh.length === 0) store.delete(k);
      else store.set(k, fresh);
    }
  }
  return { success: true, remaining: limit - hits.length, resetMs: windowMs };
}

/** IP real del cliente. Tras Cloudflare, CF-Connecting-IP es la fuente fiable. */
export function clientIp(req: Request): string {
  return (
    req.headers.get('cf-connecting-ip') ||
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    req.headers.get('x-real-ip') ||
    'anonymous'
  );
}

/**
 * Aplica rate limit por IP a una ruta. Devuelve una respuesta 429 si se superó
 * el límite, o null si puede continuar. `bucket` separa los contadores por ruta.
 */
export function enforceRateLimit(
  req: Request,
  bucket: string,
  limit: number,
  windowMs: number
): NextResponse | null {
  const { success, resetMs } = rateLimit(`${bucket}:${clientIp(req)}`, limit, windowMs);
  if (success) return null;
  return NextResponse.json(
    { error: 'too_many_requests' },
    { status: 429, headers: { 'Retry-After': String(Math.ceil(resetMs / 1000)) } }
  );
}
