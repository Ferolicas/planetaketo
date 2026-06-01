import { NextResponse } from "next/server";
import { authGuard } from "@/lib/auth";
import {
  deleteDailyMenuItem,
  updateDailyMenuItem,
} from "@/lib/queries/daily-menu";
import { dailyMenuUpdateSchema, formatZodError } from "@/lib/validations";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface Ctx {
  params: { id: string };
}

// PATCH /api/daily-menu/:id  -> actualiza gramos de un item
export async function PATCH(req: Request, { params }: Ctx) {
  try {
    const guard = await authGuard();
    if (!guard.ok) return guard.res;
    const userId = guard.userId;

    const body = await req.json().catch(() => null);
    const parsed = dailyMenuUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Datos invalidos", details: formatZodError(parsed.error) },
        { status: 400 }
      );
    }

    const item = await updateDailyMenuItem(userId, params.id, parsed.data.grams);
    if (!item) {
      return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    }
    return NextResponse.json({ item });
  } catch (err) {
    console.error("[PATCH /api/daily-menu/:id]", err);
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}

// DELETE /api/daily-menu/:id
export async function DELETE(_req: Request, { params }: Ctx) {
  try {
    const guard = await authGuard();
    if (!guard.ok) return guard.res;
    const userId = guard.userId;
    const ok = await deleteDailyMenuItem(userId, params.id);
    if (!ok) {
      return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[DELETE /api/daily-menu/:id]", err);
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}
