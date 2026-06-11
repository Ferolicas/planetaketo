import { NextResponse } from "next/server";
import { z } from "zod";
import { queryOne } from "@/lib/db";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import {
  verifyPassword,
  ensureProfile,
  makeSessionValue,
  SESSION_COOKIE,
  sessionCookieOptions,
} from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1).max(200),
});

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos invalidos" }, { status: 400 });
  }
  const { email, password } = parsed.data;

  // Rate limit: las cuentas nuevas nacen con clave generica, asi que el
  // login es el endpoint mas sensible a fuerza bruta / robo de cuenta.
  const ip = clientIp(req);
  const rlIp = rateLimit(`login:ip:${ip}`, 10, 60_000);
  const rlEmail = rateLimit(`login:email:${email.toLowerCase()}`, 5, 60_000);
  if (!rlIp.success || !rlEmail.success) {
    const resetMs = Math.max(rlIp.resetMs, rlEmail.resetMs);
    return NextResponse.json(
      { error: "Demasiados intentos. Espera un momento e intenta de nuevo." },
      { status: 429, headers: { "Retry-After": String(Math.ceil(resetMs / 1000)) } }
    );
  }

  try {
    const acc = await queryOne<{
      id: string;
      email: string;
      password_hash: string;
      must_change_password: boolean;
    }>(
      `SELECT id, email, password_hash, must_change_password
       FROM ketoscan_accounts WHERE email = $1`,
      [email.toLowerCase()]
    );

    if (!acc || !(await verifyPassword(password, acc.password_hash))) {
      return NextResponse.json({ error: "Credenciales invalidas" }, { status: 401 });
    }

    // Garantiza el perfil (fila en users) para esta cuenta
    await ensureProfile(acc.id);

    const res = NextResponse.json({
      email: acc.email,
      mustChangePassword: acc.must_change_password,
    });
    res.cookies.set(SESSION_COOKIE, makeSessionValue(acc.id), sessionCookieOptions);
    return res;
  } catch (err) {
    console.error("[ketoscan login]", err);
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}
