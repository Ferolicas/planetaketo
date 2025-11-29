import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabase';
import bcrypt from 'bcryptjs';

export interface Session {
  user: {
    id: string;
    email: string;
    name: string | null;
    role: string;
    image: string | null;
  };
}

export async function createSession(userId: string): Promise<string> {
  const token = generateSessionToken();
  const cookieStore = await cookies();

  cookieStore.set('session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: '/',
  });

  // Store session in memory or database if needed
  return token;
}

export async function getSession(): Promise<Session | null> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('session')?.value;

  if (!sessionToken) {
    return null;
  }

  // For now, decode the token (in production, validate JWT)
  try {
    const userId = Buffer.from(sessionToken, 'base64').toString('utf-8');

    const { data: user, error } = await supabaseAdmin
      .from('User')
      .select('id, email, name, role, image')
      .eq('id', userId)
      .single();

    if (error || !user) {
      return null;
    }

    return { user };
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

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

function generateSessionToken(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}
