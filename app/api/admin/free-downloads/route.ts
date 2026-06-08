import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSession } from '@/lib/auth/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Lista de quienes DESCARGARON el libro gratis (download_tokens.used = true),
// con el país del lead para mostrar la bandera. Tolerante a que leads.country
// no exista todavía (en ese caso, país nulo => globo).
export async function GET() {
  const session = await getSession();
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    let rows: { email: string; country: string | null }[];
    try {
      rows = (
        await query<{ email: string; country: string | null }>(
          `SELECT dt.email, l.country
           FROM download_tokens dt
           LEFT JOIN leads l ON l.id = dt.lead_id
           WHERE dt.used = true
           ORDER BY dt.used_at DESC NULLS LAST
           LIMIT 1000`
        )
      ).rows;
    } catch {
      // leads.country aún no existe: devolvemos sin país
      rows = (
        await query<{ email: string; country: string | null }>(
          `SELECT email, NULL::text AS country
           FROM download_tokens
           WHERE used = true
           ORDER BY used_at DESC NULLS LAST
           LIMIT 1000`
        )
      ).rows;
    }
    return NextResponse.json({ rows });
  } catch (err) {
    console.error('[admin/free-downloads]', (err as Error).message);
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}
