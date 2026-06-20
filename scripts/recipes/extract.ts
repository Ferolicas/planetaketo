/**
 * Extracción de recetas (Fase 2).
 *
 * Lee los vídeos de receta de Planeta Keto desde la BD `youtube_analytics`
 * (descripción + transcripción) y los estructura con OpenAI en recetas listas
 * para publicar, escribiéndolas en `published_recipes` de la BD `planetaketo`.
 *
 * La IA solo ESTRUCTURA contenido real del autor; no inventa recetas.
 *
 * Uso (en el VPS, cwd /apps/planetaketo):
 *   pnpm exec tsx scripts/recipes/extract.ts            # todas las pendientes
 *   pnpm exec tsx scripts/recipes/extract.ts --limit 3  # solo 3 (prueba)
 *   pnpm exec tsx scripts/recipes/extract.ts --force    # re-extrae (respeta edited=true)
 *   pnpm exec tsx scripts/recipes/extract.ts --only <videoId>
 *
 * Env (en .env.local de planetaketo):
 *   DATABASE_URL                     -> BD planetaketo (escritura)
 *   YOUTUBE_ANALYTICS_DATABASE_URL   -> BD youtube_analytics (lectura)
 *   OPENAI_API_KEY
 */
import { Pool } from 'pg';
import { z } from 'zod';
import dotenv from 'dotenv';
import path from 'node:path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const RECIPES_PLAYLIST_ID = 'PLZ8wIuDyp-hEfGAvSCAwfJtzU9B7otp_F'; // "Recetas Keto Fáciles"
const MODEL = 'gpt-4o-mini';
const TRANSCRIPT_MAX = 7000;

function req(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Falta ${name} en el entorno (.env.local)`);
  return v;
}

const OPENAI_API_KEY = req('OPENAI_API_KEY');
const ytPool = new Pool({ connectionString: req('YOUTUBE_ANALYTICS_DATABASE_URL'), max: 4 });
const pkPool = new Pool({ connectionString: req('DATABASE_URL'), max: 4 });

// ---- args ----
const args = process.argv.slice(2);
const getArg = (k: string) => {
  const i = args.indexOf(k);
  return i >= 0 ? args[i + 1] : undefined;
};
const LIMIT = getArg('--limit') ? Number(getArg('--limit')) : undefined;
const ONLY = getArg('--only');
const FORCE = args.includes('--force');

// ---- validación de la salida del modelo ----
const numOrNull = z
  .union([z.number(), z.string(), z.null()])
  .optional()
  .transform((v) => {
    if (v === null || v === undefined || v === '') return null;
    const n = Math.round(Number(v));
    return Number.isFinite(n) ? n : null;
  });

const RecipeSchema = z.object({
  title: z.string().min(2),
  summary: z.string().default(''),
  category: z.string().default('cena'),
  ingredients: z
    .array(z.object({ quantity: z.string().default(''), item: z.string() }))
    .default([]),
  steps: z.array(z.string()).default([]),
  tips: z
    .string()
    .nullable()
    .optional()
    .transform((v) => v ?? null),
  prepMinutes: numOrNull,
  cookMinutes: numOrNull,
  totalMinutes: numOrNull,
  servings: numOrNull,
  nutrition: z
    .object({ calories: numOrNull, protein: numOrNull, fat: numOrNull, netCarbs: numOrNull })
    .nullable()
    .optional()
    .transform((v) => v ?? null),
  keywords: z.array(z.string()).default([]),
});
type Recipe = z.infer<typeof RecipeSchema>;

const SYSTEM_PROMPT = `Eres editor gastronómico de "Planeta Keto". A partir del TÍTULO, la DESCRIPCIÓN y la TRANSCRIPCIÓN de un vídeo de receta keto, devuelve EXCLUSIVAMENTE un objeto JSON válido (sin texto adicional) con esta forma exacta:
{
  "title": "nombre limpio del plato, SIN 'Recetas Keto:' ni sufijos de marketing ni '| ...'",
  "summary": "1-2 frases atractivas que describan el plato",
  "category": "una de: desayuno, almuerzo, cena, postre, pan, salsa, snack, bebida, guarnicion, ensalada",
  "ingredients": [{"quantity": "400 g", "item": "queso crema a temperatura ambiente"}],
  "steps": ["instrucción clara en imperativo, en orden, sin 'Paso 1'"],
  "tips": "consejos o variaciones, o null",
  "prepMinutes": número o null,
  "cookMinutes": número o null,
  "totalMinutes": número o null,
  "servings": número o null,
  "nutrition": {"calories": número, "protein": número, "fat": número, "netCarbs": número},
  "keywords": ["4 a 8 términos de búsqueda"]
}
REGLAS:
- La DESCRIPCIÓN trae la lista de ingredientes con cantidades: úsala como fuente AUTORITATIVA para "ingredients".
- Usa la TRANSCRIPCIÓN para reconstruir "steps" en orden, claros y concisos.
- Ignora las repeticiones de la transcripción (vienen de subtítulos solapados).
- No marques como keto un ingrediente "opcional no keto" (p. ej. azúcar); si aparece, menciónalo solo en "tips".
- Estima "nutrition" por ración y los tiempos de forma realista si no se indican.
- Español neutro. No inventes ingredientes que no aparezcan en el material.`;

async function callOpenAI(title: string, description: string, transcript: string): Promise<Recipe> {
  const user = `TÍTULO:\n${title}\n\nDESCRIPCIÓN:\n${description || '(sin descripción)'}\n\nTRANSCRIPCIÓN:\n${(transcript || '(sin transcripción)').slice(0, TRANSCRIPT_MAX)}`;
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: MODEL,
      temperature: 0.2,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: user },
      ],
    }),
  });
  if (!res.ok) throw new Error(`OpenAI ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const data = (await res.json()) as { choices: { message: { content: string } }[] };
  return RecipeSchema.parse(JSON.parse(data.choices[0].message.content));
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Mn}/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

async function uniqueSlug(base: string, videoId: string): Promise<string> {
  let slug = base || videoId.toLowerCase();
  for (let n = 2; n < 50; n++) {
    const r = await pkPool.query<{ video_id: string }>(
      'SELECT video_id FROM published_recipes WHERE slug = $1',
      [slug]
    );
    if (r.rowCount === 0 || r.rows[0].video_id === videoId) return slug;
    slug = `${base}-${n}`;
  }
  return `${base}-${videoId.toLowerCase()}`;
}

function thumbUrl(thumbnails: Record<string, { url: string }> | null, videoId: string): string {
  return (
    thumbnails?.maxres?.url ||
    thumbnails?.standard?.url ||
    thumbnails?.high?.url ||
    `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`
  );
}

interface SourceRow {
  video_id: string;
  title: string;
  description: string | null;
  duration_seconds: number | null;
  published_at: Date | null;
  thumbnails: Record<string, { url: string }> | null;
  full_text: string | null;
}

async function main() {
  console.log(`[extract] modelo=${MODEL} force=${FORCE} limit=${LIMIT ?? 'todas'} only=${ONLY ?? '-'}`);

  // Set de recetas = vídeos NO-short con duración (excluye Shorts y directos),
  // públicos. No se usa playlist_items porque en youtube_analytics está vacía.
  const where = ONLY
    ? 'v.video_id = $1'
    : `COALESCE(v.is_short,false) = false AND COALESCE(v.duration_seconds,0) > 0 AND COALESCE(v.privacy_status,'public') = 'public'`;
  const params: string[] = ONLY ? [ONLY] : [];

  const { rows } = await ytPool.query<SourceRow>(
    `SELECT v.video_id, v.title, v.description, v.duration_seconds, v.published_at,
            v.thumbnails, t.full_text
       FROM videos v
       LEFT JOIN transcripts t ON t.video_id = v.video_id
      WHERE ${where}
      ORDER BY v.published_at DESC NULLS LAST`,
    params
  );

  // Sin --force ni --only, saltar las que ya existen
  let pending = rows;
  if (!FORCE && !ONLY) {
    const existing = new Set(
      (await pkPool.query<{ video_id: string }>('SELECT video_id FROM published_recipes')).rows.map(
        (r) => r.video_id
      )
    );
    pending = rows.filter((r) => !existing.has(r.video_id));
  }
  if (LIMIT) pending = pending.slice(0, LIMIT);

  console.log(`[extract] candidatas=${rows.length} a procesar=${pending.length}`);

  let ok = 0;
  let fail = 0;
  for (const v of pending) {
    try {
      const r = await callOpenAI(v.title, v.description ?? '', v.full_text ?? '');
      const slug = await uniqueSlug(slugify(r.title), v.video_id);
      const totalMin = r.totalMinutes ?? ((r.prepMinutes ?? 0) + (r.cookMinutes ?? 0) || null);
      await pkPool.query(
        `INSERT INTO published_recipes
           (video_id, slug, title, summary, category, ingredients, steps, tips,
            prep_minutes, cook_minutes, total_minutes, servings, nutrition, keywords,
            image_url, youtube_url, video_published_at, duration_seconds, model, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6::jsonb,$7::jsonb,$8,$9,$10,$11,$12,$13::jsonb,$14::text[],
                 $15,$16,$17,$18,$19, now())
         ON CONFLICT (video_id) DO UPDATE SET
           slug=EXCLUDED.slug, title=EXCLUDED.title, summary=EXCLUDED.summary,
           category=EXCLUDED.category, ingredients=EXCLUDED.ingredients, steps=EXCLUDED.steps,
           tips=EXCLUDED.tips, prep_minutes=EXCLUDED.prep_minutes, cook_minutes=EXCLUDED.cook_minutes,
           total_minutes=EXCLUDED.total_minutes, servings=EXCLUDED.servings, nutrition=EXCLUDED.nutrition,
           keywords=EXCLUDED.keywords, image_url=EXCLUDED.image_url, youtube_url=EXCLUDED.youtube_url,
           video_published_at=EXCLUDED.video_published_at, duration_seconds=EXCLUDED.duration_seconds,
           model=EXCLUDED.model, updated_at=now()
         WHERE published_recipes.edited = false`,
        [
          v.video_id,
          slug,
          r.title,
          r.summary,
          r.category,
          JSON.stringify(r.ingredients),
          JSON.stringify(r.steps),
          r.tips,
          r.prepMinutes,
          r.cookMinutes,
          totalMin,
          r.servings,
          r.nutrition ? JSON.stringify(r.nutrition) : null,
          r.keywords,
          thumbUrl(v.thumbnails, v.video_id),
          `https://www.youtube.com/watch?v=${v.video_id}`,
          v.published_at,
          v.duration_seconds,
          MODEL,
        ]
      );
      ok++;
      console.log(`  ✓ ${slug}  (${r.ingredients.length} ingr, ${r.steps.length} pasos)`);
    } catch (e) {
      fail++;
      console.error(`  ✗ ${v.video_id} "${v.title.slice(0, 50)}": ${(e as Error).message}`);
    }
  }

  console.log(`[extract] hecho: ${ok} ok, ${fail} fallos`);
  await ytPool.end();
  await pkPool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
