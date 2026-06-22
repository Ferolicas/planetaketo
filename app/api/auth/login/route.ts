import { NextRequest, NextResponse } from 'next/server';
import { queryOne } from '@/lib/db';
import { verifyPassword, signSessionToken, SESSION_COOKIE_OPTS } from '@/lib/auth/session';
import { enforceRateLimit } from '@/lib/rate-limit';

// Login del panel de administrador (pg, tabla `admins`).
export async function POST(request: NextRequest) {
  // Anti fuerza bruta: 8 intentos por IP cada 10 minutos.
  const limited = enforceRateLimit(request, 'login', 8, 10 * 60_000);
  if (limited) return limited;

  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const admin = await queryOne<{
      id: string;
      email: string;
      name: string | null;
      role: string;
      password_hash: string;
    }>(
      `SELECT id, email, name, role, password_hash FROM admins WHERE email = $1`,
      [email.toLowerCase()]
    );

    if (!admin) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const isValid = await verifyPassword(password, admin.password_hash);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const sessionToken = signSessionToken(admin.id);

    const response = NextResponse.json({
      user: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
      },
    });

    response.cookies.set('session', sessionToken, SESSION_COOKIE_OPTS);

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Failed to login' }, { status: 500 });
  }
}
