// ============================================================
// Clasificación de la fuente de tráfico (pura, sin I/O — server o cliente).
// A partir de los UTM y el referrer distingue TikTok / YouTube / Instagram /
// Facebook / búsqueda (google…) / referral / directo. No hay fingerprinting.
// ============================================================

/** Host limpio del referrer (sin www. ni querystring). null si es vacío/propio. */
export function hostFromReferrer(referrer: string | null | undefined, selfHost?: string): string | null {
  if (!referrer) return null;
  try {
    const host = new URL(referrer).hostname.replace(/^www\./, '').toLowerCase();
    if (!host) return null;
    if (selfHost && host === selfHost.replace(/^www\./, '').toLowerCase()) return null; // navegación interna
    return host;
  } catch {
    return null;
  }
}

function normalizeKnown(value: string): string | null {
  const v = value.toLowerCase();
  if (/tiktok|^tt$/.test(v)) return 'tiktok';
  if (/youtube|youtu\.be|^yt$/.test(v)) return 'youtube';
  if (/instagram|^ig$/.test(v)) return 'instagram';
  if (/facebook|fb\.|^fb$|fb$/.test(v)) return 'facebook';
  if (/twitter|t\.co|x\.com/.test(v)) return 'twitter';
  if (/google|bing|duckduckgo|yahoo|ecosia|^search$/.test(v)) return 'google';
  return null;
}

/**
 * Etiqueta de fuente: utm_source manda; si no, se deduce del host del referrer;
 * si no hay nada, es tráfico directo.
 */
export function trafficSource(opts: {
  utmSource?: string | null;
  referrerHost?: string | null;
}): string {
  if (opts.utmSource) {
    return normalizeKnown(opts.utmSource) ?? opts.utmSource.toLowerCase().slice(0, 32);
  }
  if (opts.referrerHost) {
    return normalizeKnown(opts.referrerHost) ?? 'referral';
  }
  return 'direct';
}
