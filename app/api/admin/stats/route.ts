import { NextResponse } from 'next/server';
import { queryOne } from '@/lib/db';
import { getSession } from '@/lib/auth/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Totales del panel admin. Se consulta por polling (cada ~10s) desde el cliente.
export async function GET() {
  const session = await getSession();
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Compradores reales = filas en customers (se crean al confirmarse un pago)
    const customers = await queryOne<{ count: number }>(
      `SELECT COUNT(*)::int AS count FROM customers`
    );
    // Descargas del libro GRATIS = tokens del lead magnet ya usados
    const freeDownloads = await queryOne<{ count: number }>(
      `SELECT COUNT(*)::int AS count FROM download_tokens WHERE used = true`
    );

    // Tráfico de HOY (zona Europe/Madrid). Tolerante a que la tabla aún no exista.
    let visitsToday = 0;
    let pageviewsToday = 0;
    let checkoutClicksToday = 0;
    try {
      const traffic = await queryOne<{
        visits: number;
        pageviews: number;
        clicks: number;
      }>(
        `SELECT
           COUNT(DISTINCT visitor_id) FILTER (WHERE type = 'pageview')::int       AS visits,
           COUNT(*)                   FILTER (WHERE type = 'pageview')::int       AS pageviews,
           COUNT(*)                   FILTER (WHERE type = 'checkout_click')::int AS clicks
         FROM analytics_events
         WHERE (created_at AT TIME ZONE 'Europe/Madrid')::date
             = (now()      AT TIME ZONE 'Europe/Madrid')::date`
      );
      visitsToday = traffic?.visits ?? 0;
      pageviewsToday = traffic?.pageviews ?? 0;
      checkoutClicksToday = traffic?.clicks ?? 0;
    } catch (err) {
      console.warn('[stats] analítica no disponible:', (err as Error).message);
    }

    return NextResponse.json({
      customers: customers?.count ?? 0,
      freeDownloads: freeDownloads?.count ?? 0,
      visitsToday,
      pageviewsToday,
      checkoutClicksToday,
    });
  } catch (error) {
    console.error('[GET /api/admin/stats]', error);
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}
