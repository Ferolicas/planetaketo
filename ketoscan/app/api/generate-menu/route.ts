import { NextResponse } from "next/server";
import type Anthropic from "@anthropic-ai/sdk";
import { getAnthropic, getModel, extractJson } from "@/lib/anthropic";
import { authGuard } from "@/lib/auth";
import { getProfile } from "@/lib/queries/profile";
import { listFoods } from "@/lib/queries/foods";
import { replaceWeeklyMenu } from "@/lib/queries/weekly-menu";
import { calcMacroTargets } from "@/lib/calculations/macros";
import {
  generateMenuSchema,
  formatZodError,
} from "@/lib/validations";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { weekStartISO, num } from "@/lib/utils";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 90;

const modelMenuSchema = z.object({
  days: z
    .array(
      z.object({
        day_number: z.number().int().min(1).max(7),
        meals: z
          .array(
            z.object({
              food_id: z.string(),
              food_name: z.string().max(200),
              grams: z.number().positive().max(2000),
              meal_type: z.string().max(20),
            })
          )
          .max(12),
      })
    )
    .max(7),
});

export async function POST(req: Request) {
  const ip = clientIp(req);
  const rl = rateLimit(`genmenu:${ip}`, 4, 60_000);
  if (!rl.success) {
    return NextResponse.json(
      { error: "Demasiadas peticiones. Espera un momento." },
      { status: 429, headers: { "Retry-After": String(Math.ceil(rl.resetMs / 1000)) } }
    );
  }

  try {
    const guard = await authGuard();
    if (!guard.ok) return guard.res;
    const userId = guard.userId;

    const body = await req.json().catch(() => ({}));
    const parsed = generateMenuSchema.safeParse(body ?? {});
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Datos invalidos", details: formatZodError(parsed.error) },
        { status: 400 }
      );
    }

    const weekStart = parsed.data.week_start || weekStartISO();
    const [profile, foods] = await Promise.all([
      getProfile(userId),
      listFoods(userId),
    ]);

    if (foods.length === 0) {
      return NextResponse.json(
        {
          error:
            "No tienes alimentos guardados. Agrega o escanea alimentos antes de generar el menu.",
        },
        { status: 400 }
      );
    }

    const targets = profile ? calcMacroTargets(profile) : null;
    if (!targets) {
      return NextResponse.json(
        {
          error:
            "Completa tu perfil (peso, altura, edad, sexo) para calcular tus objetivos.",
        },
        { status: 400 }
      );
    }

    // Catalogo compacto de alimentos para el prompt
    const catalog = foods.map((f) => ({
      food_id: f.id,
      name: f.name,
      kcal: num(f.calories_per_100g),
      protein: num(f.protein_per_100g),
      carbs: num(f.carbs_per_100g),
      fat: num(f.fat_per_100g),
      fiber: num(f.fiber_per_100g),
    }));

    const dietType = profile?.diet_type ?? "keto";
    const system = `Eres un nutricionista keto. Construyes menus semanales usando UNICAMENTE los alimentos del catalogo provisto.
Reglas estrictas:
- Usa solo food_id que existan en el catalogo. NUNCA inventes food_id.
- Cada dia debe acercarse a los objetivos diarios: ${targets.calories} kcal, ${targets.protein_g}g proteina, ${targets.carbs_g}g carbos, ${targets.fat_g}g grasa.
- Tipo de dieta: ${dietType}. Para keto, manten los carbos netos del dia por debajo del objetivo de carbos.
- meal_type debe ser uno de: "desayuno", "almuerzo", "cena", "snack".
- Ajusta los gramos para cuadrar macros. Varia los alimentos entre dias.
- Responde SOLO con JSON valido, sin markdown ni texto extra.

Formato exacto:
{
  "days": [
    {
      "day_number": 1,
      "meals": [
        { "food_id": "uuid-del-catalogo", "food_name": "string", "grams": number, "meal_type": "desayuno" }
      ]
    }
  ]
}`;

    const userMsg = `Catalogo de alimentos (valores por 100g):
${JSON.stringify(catalog, null, 2)}

Genera un menu para ${parsed.data.days} dia(s), con ~${parsed.data.meals_per_day} comidas por dia.
${parsed.data.notes ? `Notas del usuario: ${parsed.data.notes}` : ""}`;

    const anthropic = getAnthropic();
    const message = await anthropic.messages.create({
      model: getModel(),
      max_tokens: 4096,
      system,
      messages: [{ role: "user", content: userMsg }],
    });

    const textBlock = message.content.find(
      (b): b is Anthropic.TextBlock => b.type === "text"
    );
    if (!textBlock) {
      return NextResponse.json(
        { error: "El modelo no devolvio texto" },
        { status: 502 }
      );
    }

    const raw = extractJson(textBlock.text);
    const validated = modelMenuSchema.safeParse(raw);
    if (!validated.success) {
      console.error("[generate-menu] JSON invalido", validated.error);
      return NextResponse.json(
        { error: "No se pudo interpretar el menu generado" },
        { status: 502 }
      );
    }

    // Filtrar a food_ids reales y aplanar a filas
    const validIds = new Set(foods.map((f) => f.id));
    const nameById = new Map(foods.map((f) => [f.id, f.name]));
    const rows = [];
    for (const day of validated.data.days) {
      for (const meal of day.meals) {
        if (!validIds.has(meal.food_id)) continue; // descartar inventados
        rows.push({
          day_number: day.day_number,
          food_id: meal.food_id,
          food_name: nameById.get(meal.food_id) ?? meal.food_name,
          grams: Math.round(meal.grams),
          meal_type: meal.meal_type,
        });
      }
    }

    if (rows.length === 0) {
      return NextResponse.json(
        { error: "El menu generado no uso alimentos validos. Intenta de nuevo." },
        { status: 502 }
      );
    }

    const items = await replaceWeeklyMenu(userId, weekStart, rows);
    return NextResponse.json({ week_start: weekStart, items });
  } catch (err) {
    console.error("[POST /api/generate-menu]", err);
    return NextResponse.json(
      { error: "No se pudo generar el menu. Verifica la ANTHROPIC_API_KEY." },
      { status: 500 }
    );
  }
}
