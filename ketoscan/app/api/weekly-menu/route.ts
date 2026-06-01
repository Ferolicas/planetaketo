import { NextResponse } from "next/server";
import { authGuard } from "@/lib/auth";
import { clearWeeklyMenu, listWeeklyMenu } from "@/lib/queries/weekly-menu";
import { weekStartISO } from "@/lib/utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/weekly-menu?week_start=YYYY-MM-DD
export async function GET(req: Request) {
  try {
    const guard = await authGuard();
    if (!guard.ok) return guard.res;
    const userId = guard.userId;
    const { searchParams } = new URL(req.url);
    const weekStart = searchParams.get("week_start") || weekStartISO();

    const items = await listWeeklyMenu(userId, weekStart);
    return NextResponse.json({ week_start: weekStart, items });
  } catch (err) {
    console.error("[GET /api/weekly-menu]", err);
    return NextResponse.json(
      { error: "No se pudo cargar el menu semanal" },
      { status: 500 }
    );
  }
}

// DELETE /api/weekly-menu?week_start=YYYY-MM-DD
export async function DELETE(req: Request) {
  try {
    const guard = await authGuard();
    if (!guard.ok) return guard.res;
    const userId = guard.userId;
    const { searchParams } = new URL(req.url);
    const weekStart = searchParams.get("week_start") || weekStartISO();

    await clearWeeklyMenu(userId, weekStart);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[DELETE /api/weekly-menu]", err);
    return NextResponse.json(
      { error: "No se pudo limpiar el menu semanal" },
      { status: 500 }
    );
  }
}
