import { cookies } from 'next/headers';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { queryOne } from '@/lib/db';

// ============================================================
// Sesión de administrador — pg (tabla `admins`)
// El frontend público NO tiene login; el único login web es este (panel admin).
// La cookie httpOnly es `base64url(admin.id).HMAC-SHA256(payload, SESSION_SECRET)`:
// va FIRMADA, así un id de admin filtrado no permite forjar sesión, y rotar
// SESSION_SECRET revoca todas las sesiones al instante.
// ============================================================

const COOKIE = 'session';
const MAX_AGE = 60 * 60 * 24 * 30; // 30 días

function getSecret(): string {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 16) {
    throw new Error('SESSION_SECRET no configurada (mínimo 16 caracteres)');
  }
  return s;
}

function sign(payload: string): string {
  return crypto.createHmac('sha256', getSecret()).update(payload).digest('base64url');
}

/** Token firmado para un admin. */
export function signSessionToken(adminId: string): string {
  const payload = Buffer.from(adminId).toString('base64url');
  return `${payload}.${sign(payload)}`;
}

/** Devuelve el adminId si la firma es válida; null si no. Comparación en tiempo constante. */
export function verifySessionToken(token: string | undefined | null): string | null {
  if (!token) return null;
  const dot = token.indexOf('.');
  if (dot <= 0) return null;
  const payload = token.slice(0, dot);
  const mac = token.slice(dot + 1);
  let expected: string;
  try {
    expected = sign(payload);
  } catch {
    return null; // sin secreto → fail-closed
  }
  const a = Buffer.from(mac);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    return Buffer.from(payload, 'base64url').toString('utf-8');
  } catch {
    return null;
  }
}

export const SESSION_COOKIE_OPTS = {
  httpOnly: true as const,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: MAX_AGE,
  path: '/',
};

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
  const token = signSessionToken(adminId);
  const cookieStore = await cookies();
  cookieStore.set(COOKIE, token, SESSION_COOKIE_OPTS);
  return token;
}

export async function getSession(): Promise<Session | null> {
  const cookieStore = await cookies();
  const adminId = verifySessionToken(cookieStore.get(COOKIE)?.value);
  if (!adminId) return null;

  try {
    const admin = await queryOne<AdminRow>(
      `SELECT id, email, name, role, image FROM admins WHERE id = $1`,
      [adminId]
    );
    if (!admin) return null;
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
