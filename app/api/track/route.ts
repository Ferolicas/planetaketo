import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { query } from '@/lib/db';
import { getGeoFromRequest } from '@/lib/geo';
import { hostFromReferrer, trafficSource } from '@/lib/analytics/source';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ============================================================
// Colector de analítica propia (RGPD). El navegador lo llama SOLO tras el
// consentimiento (el gating es en cliente). Nunca rompe la navegación: pase lo
// que pase responde 204.
//
// Privacidad: NO se guarda la IP. El país sale de CF-IPCountry (Cloudflare) y,
// si no está, de una geolocalización por IP que se usa en memoria y se descarta.
// El id de sesión es un UUID aleatorio de cookie de 1ª parte (pk_sid), enviado
// por el cliente; jamás se deriva de la IP.
// ============================================================

const Schema = z.object({
  sid: z.string().uuid(),
  event: z.enum(['session_start', 'heartbeat', 'click', 'section', 'pageview']),
  activeSeconds: z.number().int().nonnegative().max(86_400).optional(),
  button: z.string().max(64).optional(),
  section: z.string().max(64).optional(),
  utm: z
    .object({
      source: z.string().max(128).optional(),
      medium: z.string().max(128).optional(),
      campaign: z.string().max(128).optional(),
    })
    .optional(),
  referrer: z.string().max(1024).optional(),
  path: z.string().max(512).optional(),
});

const noContent = () => new NextResponse(null, { status: 204 });

/** País sin almacenar IP: CF-IPCountry → fallback geo por IP (en memoria). */
function cfCountry(req: NextRequest): string | null {
  const cc = req.headers.get('cf-ipcountry')?.toUpperCase() ?? '';
  // 'XX' = desconocido, 'T1' = red Tor → tratar como nulo.
  if (/^[A-Z]{2}$/.test(cc) && cc !== 'XX' && cc !== 'T1') return cc;
  return null;
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = JSON.parse(await req.text()); // tolera fetch y navigator.sendBeacon (Blob)
  } catch {
    return noContent();
  }

  const parsed = Schema.safeParse(body);
  if (!parsed.success) return noContent();
  const e = parsed.data;

  try {
    // Garantiza que la fila exista (ningún evento se pierde por carreras de red).
    await query(
      `INSERT INTO analytics_sessions (id) VALUES ($1) ON CONFLICT (id) DO NOTHING`,
      [e.sid]
    );

    switch (e.event) {
      case 'session_start': {
        const country = cfCountry(req) ?? (await getGeoFromRequest(req)).country;
        const referrerHost = hostFromReferrer(e.referrer, req.headers.get('host') ?? undefined);
        const source = trafficSource({ utmSource: e.utm?.source ?? null, referrerHost });
        // COALESCE: no pisamos los datos del primer arranque en reenvíos.
        await query(
          `UPDATE analytics_sessions SET
             country        = COALESCE(country, $2),
             traffic_source = COALESCE(traffic_source, $3),
             utm_source     = COALESCE(utm_source, $4),
             utm_medium     = COALESCE(utm_medium, $5),
             utm_campaign   = COALESCE(utm_campaign, $6),
             referrer_host  = COALESCE(referrer_host, $7),
             last_seen_at   = now(),
             updated_at     = now()
           WHERE id = $1`,
          [
            e.sid,
            country,
            source,
            e.utm?.source ?? null,
            e.utm?.medium ?? null,
            e.utm?.campaign ?? null,
            referrerHost,
          ]
        );
        break;
      }

      case 'heartbeat':
        await query(
          `UPDATE analytics_sessions SET
             duration_seconds = GREATEST(duration_seconds, $2),
             last_seen_at     = now(),
             updated_at       = now()
           WHERE id = $1`,
          [e.sid, e.activeSeconds ?? 0]
        );
        break;

      case 'click':
        if (e.button) {
          await query(
            `UPDATE analytics_sessions SET
               buttons_clicked = CASE WHEN buttons_clicked @> ARRAY[$2]::text[]
                                      THEN buttons_clicked ELSE array_append(buttons_clicked, $2) END,
               last_seen_at = now(),
               updated_at   = now()
             WHERE id = $1`,
            [e.sid, e.button]
          );
        }
        break;

      case 'section':
        if (e.section) {
          await query(
            `UPDATE analytics_sessions SET
               sections_viewed = CASE WHEN sections_viewed @> ARRAY[$2]::text[]
                                      THEN sections_viewed ELSE array_append(sections_viewed, $2) END,
               last_seen_at = now(),
               updated_at   = now()
             WHERE id = $1`,
            [e.sid, e.section]
          );
        }
        break;

      case 'pageview':
        await query(
          `UPDATE analytics_sessions SET
             pages_viewed = pages_viewed + 1,
             last_seen_at = now(),
             updated_at   = now()
           WHERE id = $1`,
          [e.sid]
        );
        break;
    }
  } catch (err) {
    // La analítica nunca tumba la navegación.
    console.error('[track] error:', (err as Error).message);
  }

  return noContent();
}
