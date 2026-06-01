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

    return NextResponse.json({
      customers: customers?.count ?? 0,
      freeDownloads: freeDownloads?.count ?? 0,
    });
  } catch (error) {
    console.error('[GET /api/admin/stats]', error);
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}
