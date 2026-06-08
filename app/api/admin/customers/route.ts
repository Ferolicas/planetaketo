import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSession } from '@/lib/auth/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Lista de compradores reales (tabla customers, alimentada por el webhook de Hotmart).
// Solo email + país (la UI muestra bandera + email).
export async function GET() {
  const session = await getSession();
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const res = await query<{ email: string; country: string | null }>(
      `SELECT email, country
       FROM customers
       ORDER BY created_at DESC NULLS LAST
       LIMIT 1000`
    );
    return NextResponse.json({ rows: res.rows });
  } catch (err) {
    console.error('[admin/customers]', (err as Error).message);
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}
