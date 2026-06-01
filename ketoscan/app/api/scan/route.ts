import { NextResponse } from "next/server";
import type Anthropic from "@anthropic-ai/sdk";
import { getAnthropic, getModel, extractJson } from "@/lib/anthropic";
import { scanSchema, formatZodError } from "@/lib/validations";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import type { ScanResult } from "@/types";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Validacion de la respuesta del modelo
const modelResultSchema = z.object({
  name: z.string().min(1).max(200),
  calories_per_100g: z.number().nonnegative().max(900),
  protein_per_100g: z.number().nonnegative().max(100),
  carbs_per_100g: z.number().nonnegative().max(100),
  fat_per_100g: z.number().nonnegative().max(100),
  fiber_per_100g: z.number().nonnegative().max(100),
  sugar_per_100g: z.number().nonnegative().max(100),
  sodium_per_100g: z.number().nonnegative().max(50000),
  saturated_fat_per_100g: z.number().nonnegative().max(100),
  confidence: z.enum(["high", "medium", "low"]),
  is_keto_friendly: z.boolean(),
  notes: z.string().max(400).optional(),
});

const SYSTEM_PROMPT = `Eres un nutricionista experto en dietas keto que analiza fotos de alimentos y etiquetas nutricionales.
Tu tarea: identificar el alimento y estimar sus valores nutricionales POR CADA 100 GRAMOS.

Reglas:
- Si la foto es una etiqueta nutricional, lee los valores y NORMALIZALOS a 100g (regla de tres si la porcion es distinta).
- Si es comida sin etiqueta, estima con tu conocimiento nutricional.
- Todos los valores en gramos por 100g, excepto sodio en MILIGRAMOS por 100g y calorias en kcal por 100g.
- is_keto_friendly = true si carbos netos (carbs - fiber) por 100g son razonables para keto (tipicamente < 10g) y no es alto en azucar.
- confidence: "high" si lees una etiqueta clara, "medium" si estimas comida reconocible, "low" si la imagen es ambigua.
- Responde UNICAMENTE con un objeto JSON valido, sin texto adicional ni markdown.

Formato exacto:
{
  "name": "string",
  "calories_per_100g": number,
  "protein_per_100g": number,
  "carbs_per_100g": number,
  "fat_per_100g": number,
  "fiber_per_100g": number,
  "sugar_per_100g": number,
  "sodium_per_100g": number,
  "saturated_fat_per_100g": number,
  "confidence": "high" | "medium" | "low",
  "is_keto_friendly": boolean,
  "notes": "string corto en espanol"
}`;

function stripDataUrl(image: string): string {
  const idx = image.indexOf("base64,");
  return idx >= 0 ? image.slice(idx + "base64,".length) : image;
}

export async function POST(req: Request) {
  // Rate limit: 8 escaneos por minuto por IP
  const ip = clientIp(req);
  const rl = rateLimit(`scan:${ip}`, 8, 60_000);
  if (!rl.success) {
    return NextResponse.json(
      { error: "Demasiadas peticiones. Intenta de nuevo en unos segundos." },
      { status: 429, headers: { "Retry-After": String(Math.ceil(rl.resetMs / 1000)) } }
    );
  }

  let parsed;
  try {
    const body = await req.json().catch(() => null);
    parsed = scanSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Datos invalidos", details: formatZodError(parsed.error) },
        { status: 400 }
      );
    }
  } catch {
    return NextResponse.json({ error: "Body invalido" }, { status: 400 });
  }

  try {
    const anthropic = getAnthropic();
    const base64 = stripDataUrl(parsed.data.image);

    const userText = parsed.data.hint
      ? `Analiza este alimento. Pista del usuario: ${parsed.data.hint}`
      : "Analiza este alimento y devuelve sus valores nutricionales por 100g.";

    const message = await anthropic.messages.create({
      model: getModel(),
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: parsed.data.media_type,
                data: base64,
              },
            },
            { type: "text", text: userText },
          ],
        },
      ],
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
    const result = modelResultSchema.safeParse(raw);
    if (!result.success) {
      console.error("[scan] respuesta del modelo invalida", result.error);
      return NextResponse.json(
        { error: "No se pudo interpretar la respuesta del analisis" },
        { status: 502 }
      );
    }

    const scan: ScanResult = result.data;
    return NextResponse.json({ result: scan });
  } catch (err) {
    console.error("[POST /api/scan]", err);
    return NextResponse.json(
      { error: "No se pudo analizar la imagen. Verifica la ANTHROPIC_API_KEY." },
      { status: 500 }
    );
  }
}
