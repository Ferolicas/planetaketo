import { NextResponse } from "next/server";
import { authGuard } from "@/lib/auth";
import { getProfile, upsertProfile } from "@/lib/queries/profile";
import { profileSchema, formatZodError } from "@/lib/validations";
import { calcTdee } from "@/lib/calculations/tdee";
import { calcMacroTargets } from "@/lib/calculations/macros";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const guard = await authGuard();
    if (!guard.ok) return guard.res;
    const userId = guard.userId;
    const profile = await getProfile(userId);

    const tdee = profile ? calcTdee(profile) : null;
    const targets = profile ? calcMacroTargets(profile) : null;

    return NextResponse.json({ profile, tdee, targets });
  } catch (err) {
    console.error("[GET /api/profile]", err);
    return NextResponse.json(
      { error: "No se pudo cargar el perfil" },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const guard = await authGuard();
    if (!guard.ok) return guard.res;
    const userId = guard.userId;

    const body = await req.json().catch(() => null);
    const parsed = profileSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Datos invalidos", details: formatZodError(parsed.error) },
        { status: 400 }
      );
    }

    const profile = await upsertProfile(userId, parsed.data);
    const tdee = calcTdee(profile);
    const targets = calcMacroTargets(profile);

    return NextResponse.json({ profile, tdee, targets });
  } catch (err) {
    console.error("[PUT /api/profile]", err);
    return NextResponse.json(
      { error: "No se pudo guardar el perfil" },
      { status: 500 }
    );
  }
}
