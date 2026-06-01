import { NextResponse } from "next/server";
import { authGuard } from "@/lib/auth";
import {
  addDailyMenuItem,
  bulkUpdateGrams,
  listDailyMenu,
} from "@/lib/queries/daily-menu";
import { getProfile } from "@/lib/queries/profile";
import {
  dailyMenuAddSchema,
  dailyMenuBulkSchema,
  formatZodError,
} from "@/lib/validations";
import { sumMenuMacros, calcMacroTargets } from "@/lib/calculations/macros";
import { todayISO } from "@/lib/utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/daily-menu?date=YYYY-MM-DD
export async function GET(req: Request) {
  try {
    const guard = await authGuard();
    if (!guard.ok) return guard.res;
    const userId = guard.userId;
    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date") || todayISO();

    const [items, profile] = await Promise.all([
      listDailyMenu(userId, date),
      getProfile(userId),
    ]);

    const totals = sumMenuMacros(items);
    const targets = profile ? calcMacroTargets(profile) : null;

    return NextResponse.json({ date, items, totals, targets });
  } catch (err) {
    console.error("[GET /api/daily-menu]", err);
    return NextResponse.json(
      { error: "No se pudo cargar el menu del dia" },
      { status: 500 }
    );
  }
}

// POST /api/daily-menu  -> agrega un alimento al menu del dia
export async function POST(req: Request) {
  try {
    const guard = await authGuard();
    if (!guard.ok) return guard.res;
    const userId = guard.userId;

    const body = await req.json().catch(() => null);
    const parsed = dailyMenuAddSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Datos invalidos", details: formatZodError(parsed.error) },
        { status: 400 }
      );
    }

    const date = parsed.data.date || todayISO();
    const item = await addDailyMenuItem(
      userId,
      parsed.data.food_id,
      parsed.data.grams,
      date
    );
    return NextResponse.json({ item }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/daily-menu]", err);
    return NextResponse.json(
      { error: "No se pudo agregar el alimento" },
      { status: 500 }
    );
  }
}

// PATCH /api/daily-menu  -> actualizacion en lote de gramos (reestructuracion)
export async function PATCH(req: Request) {
  try {
    const guard = await authGuard();
    if (!guard.ok) return guard.res;
    const userId = guard.userId;

    const body = await req.json().catch(() => null);
    const parsed = dailyMenuBulkSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Datos invalidos", details: formatZodError(parsed.error) },
        { status: 400 }
      );
    }

    await bulkUpdateGrams(userId, parsed.data.updates);

    const date = parsed.data.date || todayISO();
    const items = await listDailyMenu(userId, date);
    const totals = sumMenuMacros(items);
    return NextResponse.json({ items, totals });
  } catch (err) {
    console.error("[PATCH /api/daily-menu]", err);
    return NextResponse.json(
      { error: "No se pudo actualizar el menu" },
      { status: 500 }
    );
  }
}
