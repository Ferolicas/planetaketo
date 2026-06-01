import { NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { query } from '@/lib/db';
import { getSession } from '@/lib/auth/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const schema = z.object({ email: z.string().email() });
const GENERIC_PASSWORD = 'Cliente1234*';

// Alta manual de cuenta ketoscan (sin pago). Mismo resultado que el alta
// automática de la compra: bcrypt(Cliente1234*) + must_change_password=true.
export async function POST(req: Request) {
  const session = await getSession();
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Email inválido' }, { status: 400 });
  }
  const email = parsed.data.email.toLowerCase();

  try {
    const hash = await bcrypt.hash(GENERIC_PASSWORD, 10);
    const res = await query(
      `INSERT INTO ketoscan_accounts (email, password_hash, must_change_password)
       VALUES ($1, $2, true)
       ON CONFLICT (email) DO NOTHING`,
      [email, hash]
    );

    if ((res.rowCount ?? 0) === 0) {
      return NextResponse.json(
        { created: false, message: 'Ese email ya tiene cuenta de ketoscan' },
        { status: 409 }
      );
    }

    return NextResponse.json({ created: true, email });
  } catch (error) {
    console.error('[POST /api/admin/create-ketoscan-user]', error);
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}
