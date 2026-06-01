import { cookies } from "next/headers";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { query, queryOne } from "@/lib/db";

// ============================================================
// Auth de ketoscan (multiusuario) contra la tabla `ketoscan_accounts`.
// Cookie httpOnly firmada con HMAC (no forjable). Reemplaza el modo
// single-user (DEFAULT_USER_ID). El id de la cuenta ES el id de perfil
// en la tabla `users` (foods/daily_menu/weekly_menu.user_id).
// ============================================================

export const SESSION_COOKIE = "ks_session";
const SECRET =
  process.env.SESSION_SECRET || process.env.OPENAI_API_KEY || "dev-insecure-secret";

export const sessionCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  maxAge: 60 * 60 * 24 * 30, // 30 días
  path: "/",
};

function sign(id: string): string {
  return crypto.createHmac("sha256", SECRET).update(id).digest("base64url");
}

export function makeSessionValue(accountId: string): string {
  return `${Buffer.from(accountId).toString("base64url")}.${sign(accountId)}`;
}

export function readSessionValue(token: string | undefined): string | null {
  if (!token) return null;
  const [b64, sig] = token.split(".");
  if (!b64 || !sig) return null;
  let id: string;
  try {
    id = Buffer.from(b64, "base64url").toString("utf-8");
  } catch {
    return null;
  }
  // Comparación en tiempo constante para evitar timing attacks
  const expected = sign(id);
  if (sig.length !== expected.length) return null;
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  return id;
}

// Lectura síncrona de la cookie (Next 14: cookies() es síncrono)
export function getAccountId(): string | null {
  const token = cookies().get(SESSION_COOKIE)?.value;
  return readSessionValue(token);
}

export interface SessionUser {
  id: string;
  email: string;
  must_change_password: boolean;
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const id = getAccountId();
  if (!id) return null;
  return queryOne<SessionUser>(
    `SELECT id, email, must_change_password FROM ketoscan_accounts WHERE id = $1`,
    [id]
  );
}

type GuardResult =
  | { ok: true; userId: string }
  | { ok: false; res: NextResponse };

/**
 * Exige sesión válida. Devuelve 401 si no hay sesión y 403 si la cuenta
 * todavía debe cambiar la contraseña (el cliente redirige a /cambiar-clave).
 */
export async function authGuard(): Promise<GuardResult> {
  const user = await getSessionUser();
  if (!user) {
    return { ok: false, res: NextResponse.json({ error: "No autorizado" }, { status: 401 }) };
  }
  if (user.must_change_password) {
    return {
      ok: false,
      res: NextResponse.json({ error: "Debes cambiar tu contraseña" }, { status: 403 }),
    };
  }
  return { ok: true, userId: user.id };
}

// Garantiza la fila de perfil en `users` para esta cuenta (id = account.id)
export async function ensureProfile(userId: string): Promise<void> {
  await query(
    `INSERT INTO users (id, name, diet_type) VALUES ($1, $2, 'keto')
     ON CONFLICT (id) DO NOTHING`,
    [userId, "Mi perfil"]
  );
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
