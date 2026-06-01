import { NextResponse } from "next/server";
import { z } from "zod";
import { query, queryOne } from "@/lib/db";
import { getAccountId, verifyPassword, hashPassword } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  currentPassword: z.string().min(1).max(200),
  newPassword: z.string().min(8, "Minimo 8 caracteres").max(200),
});

export async function POST(req: Request) {
  const accountId = getAccountId();
  if (!accountId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message || "Datos invalidos" },
      { status: 400 }
    );
  }

  try {
    const acc = await queryOne<{ id: string; password_hash: string }>(
      `SELECT id, password_hash FROM ketoscan_accounts WHERE id = $1`,
      [accountId]
    );
    if (!acc) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const ok = await verifyPassword(parsed.data.currentPassword, acc.password_hash);
    if (!ok) {
      return NextResponse.json(
        { error: "La contraseña actual es incorrecta" },
        { status: 400 }
      );
    }

    const newHash = await hashPassword(parsed.data.newPassword);
    await query(
      `UPDATE ketoscan_accounts
       SET password_hash = $2, must_change_password = false, updated_at = now()
       WHERE id = $1`,
      [accountId, newHash]
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[ketoscan change-password]", err);
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}
