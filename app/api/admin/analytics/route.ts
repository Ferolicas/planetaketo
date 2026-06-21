import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { getSession } from '@/lib/auth/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ============================================================
// Analítica histórica del panel /ferney (lee de analytics_sessions).
// Devuelve, para el periodo pedido:
//   - total      -> visitas, checkout, ventas y duración media del periodo
//   - aggregates -> % checkout, % compra, duración media, top países, top fuentes
//   - buckets[]  -> desglose por intervalo (hora/día/mes) con huecos a 0
// Periodos: today→hora, week→7 días, month→30 días, year→12 meses, all→meses.
// Zona horaria fija Europe/Madrid.
// ============================================================

const TZ = 'Europe/Madrid';
type Range = 'today' | 'week' | 'month' | 'year' | 'all';
type Granularity = 'hour' | 'day' | 'month';

const RANGES: Record<Range, { granularity: Granularity; days?: number }> = {
  today: { granularity: 'hour' },
  week: { granularity: 'day', days: 7 },
  month: { granularity: 'day', days: 30 },
  year: { granularity: 'month' },
  all: { granularity: 'month' },
};

// Conteos compartidos por bucket (s = analytics_sessions).
const COUNTS = `
  COUNT(s.id)::int                                                              AS visits,
  COUNT(s.id) FILTER (WHERE s.transaction_state <> 'sin_checkout')::int         AS checkouts,
  COUNT(s.id) FILTER (WHERE s.transaction_state = 'venta_completada')::int      AS sales`;

interface Bucket {
  key: string;
  visits: number;
  checkouts: number;
  sales: number;
}

function bucketsSql(range: Range): string {
  switch (range) {
    case 'today':
      return `
        WITH axis AS (SELECT generate_series(0, 23) AS h)
        SELECT lpad(a.h::text, 2, '0') AS key, ${COUNTS}
        FROM axis a
        LEFT JOIN analytics_sessions s
          ON (s.entered_at AT TIME ZONE '${TZ}')::date = (now() AT TIME ZONE '${TZ}')::date
         AND EXTRACT(HOUR FROM (s.entered_at AT TIME ZONE '${TZ}'))::int = a.h
        GROUP BY a.h ORDER BY a.h`;
    case 'week':
    case 'month': {
      const n = RANGES[range].days as number;
      return `
        WITH axis AS (
          SELECT generate_series(
            (now() AT TIME ZONE '${TZ}')::date - INTERVAL '${n - 1} days',
            (now() AT TIME ZONE '${TZ}')::date,
            INTERVAL '1 day'
          )::date AS d
        )
        SELECT to_char(a.d, 'YYYY-MM-DD') AS key, ${COUNTS}
        FROM axis a
        LEFT JOIN analytics_sessions s
          ON (s.entered_at AT TIME ZONE '${TZ}')::date = a.d
        GROUP BY a.d ORDER BY a.d`;
    }
    case 'year':
      return `
        WITH axis AS (
          SELECT generate_series(
            date_trunc('month', (now() AT TIME ZONE '${TZ}')) - INTERVAL '11 months',
            date_trunc('month', (now() AT TIME ZONE '${TZ}')),
            INTERVAL '1 month'
          ) AS m
        )
        SELECT to_char(a.m, 'YYYY-MM') AS key, ${COUNTS}
        FROM axis a
        LEFT JOIN analytics_sessions s
          ON date_trunc('month', (s.entered_at AT TIME ZONE '${TZ}')) = a.m
        GROUP BY a.m ORDER BY a.m`;
    case 'all':
      return `
        WITH bounds AS (
          SELECT date_trunc('month', min(entered_at AT TIME ZONE '${TZ}')) AS start_m,
                 date_trunc('month', (now() AT TIME ZONE '${TZ}'))          AS end_m
          FROM analytics_sessions
        ),
        axis AS (
          SELECT generate_series(start_m, end_m, INTERVAL '1 month') AS m
          FROM bounds WHERE start_m IS NOT NULL
        )
        SELECT to_char(a.m, 'YYYY-MM') AS key, ${COUNTS}
        FROM axis a
        LEFT JOIN analytics_sessions s
          ON date_trunc('month', (s.entered_at AT TIME ZONE '${TZ}')) = a.m
        GROUP BY a.m ORDER BY a.m`;
  }
}

// WHERE sobre entered_at para el periodo completo (columna sin alias).
function rangeWhere(range: Range): string {
  switch (range) {
    case 'today':
      return `WHERE (entered_at AT TIME ZONE '${TZ}')::date = (now() AT TIME ZONE '${TZ}')::date`;
    case 'week':
    case 'month': {
      const n = RANGES[range].days as number;
      return `WHERE entered_at >= ((now() AT TIME ZONE '${TZ}')::date - INTERVAL '${n - 1} days') AT TIME ZONE '${TZ}'`;
    }
    case 'year':
      return `WHERE entered_at >= (date_trunc('month', (now() AT TIME ZONE '${TZ}')) - INTERVAL '11 months') AT TIME ZONE '${TZ}'`;
    case 'all':
      return '';
  }
}

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const param = req.nextUrl.searchParams.get('range') ?? 'week';
  const range: Range = (['today', 'week', 'month', 'year', 'all'] as const).includes(param as Range)
    ? (param as Range)
    : 'week';
  const where = rangeWhere(range);

  try {
    const [buckets, total, topCountries, topSources] = await Promise.all([
      query<Bucket>(bucketsSql(range)),
      queryOne<{ visits: number; checkouts: number; sales: number; avg_duration: number }>(
        `SELECT
           COUNT(*)::int                                                          AS visits,
           COUNT(*) FILTER (WHERE transaction_state <> 'sin_checkout')::int        AS checkouts,
           COUNT(*) FILTER (WHERE transaction_state = 'venta_completada')::int     AS sales,
           COALESCE(AVG(duration_seconds), 0)::int                                 AS avg_duration
         FROM analytics_sessions ${where}`
      ),
      query<{ country: string; n: number }>(
        `SELECT country, COUNT(*)::int AS n FROM analytics_sessions
         ${where ? where + ' AND' : 'WHERE'} country IS NOT NULL
         GROUP BY country ORDER BY n DESC LIMIT 6`
      ),
      query<{ traffic_source: string; n: number }>(
        `SELECT traffic_source, COUNT(*)::int AS n FROM analytics_sessions
         ${where ? where + ' AND' : 'WHERE'} traffic_source IS NOT NULL
         GROUP BY traffic_source ORDER BY n DESC LIMIT 6`
      ),
    ]);

    const visits = total?.visits ?? 0;
    const checkouts = total?.checkouts ?? 0;
    const sales = total?.sales ?? 0;

    return NextResponse.json({
      range,
      granularity: RANGES[range].granularity,
      total: { visits, checkouts, sales, avgDuration: total?.avg_duration ?? 0 },
      aggregates: {
        checkoutRate: visits > 0 ? checkouts / visits : 0,
        purchaseRate: visits > 0 ? sales / visits : 0,
        avgDurationSeconds: total?.avg_duration ?? 0,
        topCountries: topCountries.rows,
        topSources: topSources.rows,
      },
      buckets: buckets.rows,
    });
  } catch (error) {
    console.error('[GET /api/admin/analytics]', error);
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}
