// ============================================================
// Rate limiter en memoria (ventana deslizante simple)
// ============================================================
// Para un despliegue single-VPS con PM2 esto es suficiente para
// proteger los endpoints de IA. Si se escala a multiples instancias,
// migrar a @upstash/ratelimit + Redis.

declare global {
  // eslint-disable-next-line no-var
  var __ketoscanRateStore: Map<string, number[]> | undefined;
}

const store: Map<string, number[]> =
  global.__ketoscanRateStore ?? new Map<string, number[]>();
global.__ketoscanRateStore = store;

export interface RateResult {
  success: boolean;
  remaining: number;
  resetMs: number;
}

/**
 * @param key         identificador (IP, userId...)
 * @param limit       maximo de peticiones por ventana
 * @param windowMs    tamaño de la ventana en ms
 */
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): RateResult {
  const now = Date.now();
  const windowStart = now - windowMs;

  const hits = (store.get(key) ?? []).filter((t) => t > windowStart);

  if (hits.length >= limit) {
    const resetMs = hits[0] + windowMs - now;
    store.set(key, hits);
    return { success: false, remaining: 0, resetMs: Math.max(0, resetMs) };
  }

  hits.push(now);
  store.set(key, hits);

  // Limpieza ocasional para no crecer indefinidamente
  if (store.size > 5000) {
    for (const [k, v] of store) {
      const fresh = v.filter((t) => t > windowStart);
      if (fresh.length === 0) store.delete(k);
      else store.set(k, fresh);
    }
  }

  return { success: true, remaining: limit - hits.length, resetMs: windowMs };
}

export function clientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "anonymous";
}
