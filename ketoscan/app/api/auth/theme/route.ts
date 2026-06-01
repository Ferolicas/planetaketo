import { NextResponse } from "next/server";
import { z } from "zod";
import { query } from "@/lib/db";
import { getAccountId } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({ theme: z.enum(["light", "dark"]) });

// Persiste la preferencia de tema en la cuenta (multidispositivo).
export async function POST(req: Request) {
  const accountId = getAccountId();
  if (!accountId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Tema invalido" }, { status: 400 });
  }

  try {
    await query(
      `UPDATE ketoscan_accounts SET theme = $2, updated_at = now() WHERE id = $1`,
      [accountId, parsed.data.theme]
    );
    return NextResponse.json({ ok: true, theme: parsed.data.theme });
  } catch (err) {
    console.error("[POST /api/auth/theme]", err);
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}
