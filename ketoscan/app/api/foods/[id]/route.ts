import { NextResponse } from "next/server";
import { authGuard } from "@/lib/auth";
import { deleteFood, getFood, updateFood } from "@/lib/queries/foods";
import { foodSchema, formatZodError } from "@/lib/validations";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface Ctx {
  params: { id: string };
}

export async function GET(_req: Request, { params }: Ctx) {
  try {
    const guard = await authGuard();
    if (!guard.ok) return guard.res;
    const userId = guard.userId;
    const food = await getFood(userId, params.id);
    if (!food) {
      return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    }
    return NextResponse.json({ food });
  } catch (err) {
    console.error("[GET /api/foods/:id]", err);
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: Ctx) {
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

    const food = await updateFood(userId, params.id, parsed.data);
    if (!food) {
      return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    }
    return NextResponse.json({ food });
  } catch (err) {
    console.error("[PUT /api/foods/:id]", err);
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: Ctx) {
  try {
    const guard = await authGuard();
    if (!guard.ok) return guard.res;
    const userId = guard.userId;
    const ok = await deleteFood(userId, params.id);
    if (!ok) {
      return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[DELETE /api/foods/:id]", err);
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}
