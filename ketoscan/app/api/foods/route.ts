import { NextResponse } from "next/server";
import { authGuard } from "@/lib/auth";
import { createFood, listFoods } from "@/lib/queries/foods";
import { foodSchema, formatZodError } from "@/lib/validations";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const guard = await authGuard();
    if (!guard.ok) return guard.res;
    const userId = guard.userId;
    const foods = await listFoods(userId);
    return NextResponse.json({ foods });
  } catch (err) {
    console.error("[GET /api/foods]", err);
    return NextResponse.json(
      { error: "No se pudieron cargar los alimentos" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const guard = await authGuard();
    if (!guard.ok) return guard.res;
    const userId = guard.userId;

    const body = await req.json().catch(() => null);
    const parsed = foodSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Datos invalidos", details: formatZodError(parsed.error) },
        { status: 400 }
      );
    }

    const food = await createFood(userId, parsed.data);
    return NextResponse.json({ food }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/foods]", err);
    return NextResponse.json(
      { error: "No se pudo crear el alimento" },
      { status: 500 }
    );
  }
}
