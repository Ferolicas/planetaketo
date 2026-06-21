import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSession } from '@/lib/auth/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ============================================================
// Lista de sesiones individuales para la tabla del panel /ferney:
// País | duración | botones | scroll | estado | fuente | hora.
// Filtrada por el mismo rango que el resto del panel. Solo admin.
// ============================================================

const TZ = 'Europe/Madrid';
type Range = 'today' | 'week' | 'month' | 'year' | 'all';

function rangeWhere(range: Range): string {
  switch (range) {
    case 'today':
      return `WHERE (entered_at AT TIME ZONE '${TZ}')::date = (now() AT TIME ZONE '${TZ}')::date`;
    case 'week':
      return `WHERE entered_at >= ((now() AT TIME ZONE '${TZ}')::date - INTERVAL '6 days') AT TIME ZONE '${TZ}'`;
    case 'month':
      return `WHERE entered_at >= ((now() AT TIME ZONE '${TZ}')::date - INTERVAL '29 days') AT TIME ZONE '${TZ}'`;
    case 'year':
      return `WHERE entered_at >= (date_trunc('month', (now() AT TIME ZONE '${TZ}')) - INTERVAL '11 months') AT TIME ZONE '${TZ}'`;
    case 'all':
      return '';
  }
}

interface SessionRow {
  id: string;
  country: string | null;
  traffic_source: string | null;
  duration_seconds: number;
  sections_viewed: string[];
  buttons_clicked: string[];
  transaction_state: string;
  entered_at: string;
}

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const sp = req.nextUrl.searchParams;
  const param = sp.get('range') ?? 'week';
  const range: Range = (['today', 'week', 'month', 'year', 'all'] as const).includes(param as Range)
    ? (param as Range)
    : 'week';
  const limit = Math.min(Math.max(Number(sp.get('limit') ?? 100), 1), 200);
  const offset = Math.max(Number(sp.get('offset') ?? 0), 0);

  try {
    const { rows } = await query<SessionRow>(
      `SELECT id, country, traffic_source, duration_seconds,
              sections_viewed, buttons_clicked, transaction_state, entered_at
       FROM analytics_sessions
       ${rangeWhere(range)}
       ORDER BY entered_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    return NextResponse.json({ rows });
  } catch (error) {
    console.error('[GET /api/admin/sessions]', error);
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}
