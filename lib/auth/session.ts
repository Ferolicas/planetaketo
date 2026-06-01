import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import { queryOne } from '@/lib/db';

// ============================================================
// Sesión de administrador — pg (tabla `admins`)
// El frontend público NO tiene login; el único login web es este (panel admin).
// La sesión es una cookie httpOnly cuyo valor es base64(admin.id).
// ============================================================

export interface Session {
  user: {
    id: string;
    email: string;
    name: string | null;
    role: string;
    image: string | null;
  };
}

interface AdminRow {
  id: string;
  email: string;
  name: string | null;
  role: string;
  image: string | null;
}

export async function createSession(adminId: string): Promise<string> {
  const token = Buffer.from(adminId).toString('base64');
  const cookieStore = await cookies();

  cookieStore.set('session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30, // 30 días
    path: '/',
  });

  return token;
}

export async function getSession(): Promise<Session | null> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('session')?.value;

  if (!sessionToken) {
    return null;
  }

  try {
    const adminId = Buffer.from(sessionToken, 'base64').toString('utf-8');

    const admin = await queryOne<AdminRow>(
      `SELECT id, email, name, role, image FROM admins WHERE id = $1`,
      [adminId]
    );

    if (!admin) {
      return null;
    }

    return { user: admin };
  } catch {
    return null;
  }
}

export async function deleteSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete('session');
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
