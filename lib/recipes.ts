import { query } from '@/lib/db';

// ============================================================
// Capa de datos de recetas (Fase 2).
// La web lee SOLO de published_recipes (BD planetaketo). El script
// scripts/recipes/extract.ts es quien la rellena desde youtube_analytics.
// ============================================================

export interface RecipeIngredient {
  quantity: string;
  item: string;
}

export interface RecipeNutrition {
  calories: number | null;
  protein: number | null;
  fat: number | null;
  netCarbs: number | null;
}

export interface Recipe {
  videoId: string;
  slug: string;
  title: string;
  summary: string | null;
  category: string | null;
  ingredients: RecipeIngredient[];
  steps: string[];
  tips: string | null;
  prepMinutes: number | null;
  cookMinutes: number | null;
  totalMinutes: number | null;
  servings: number | null;
  nutrition: RecipeNutrition | null;
  keywords: string[];
  imageUrl: string | null;
  youtubeUrl: string | null;
  videoPublishedAt: string | null;
  durationSeconds: number | null;
}

/** Categorías (clusters) con etiqueta y emoji, en orden de presentación. */
export const CATEGORIES: { slug: string; label: string; emoji: string }[] = [
  { slug: 'desayuno', label: 'Desayunos', emoji: '🍳' },
  { slug: 'almuerzo', label: 'Almuerzos', emoji: '🍽️' },
  { slug: 'cena', label: 'Cenas', emoji: '🌙' },
  { slug: 'postre', label: 'Postres', emoji: '🍰' },
  { slug: 'pan', label: 'Panes', emoji: '🥖' },
  { slug: 'salsa', label: 'Salsas', emoji: '🥣' },
  { slug: 'snack', label: 'Snacks', emoji: '🥨' },
  { slug: 'ensalada', label: 'Ensaladas', emoji: '🥗' },
  { slug: 'bebida', label: 'Bebidas', emoji: '🥤' },
  { slug: 'guarnicion', label: 'Guarniciones', emoji: '🍳' },
];

export function categoryMeta(slug: string | null): { label: string; emoji: string } {
  const found = CATEGORIES.find((c) => c.slug === slug);
  if (found) return { label: found.label, emoji: found.emoji };
  const s = (slug ?? 'otros').trim();
  return { label: s ? s.charAt(0).toUpperCase() + s.slice(1) : 'Otros', emoji: '🍴' };
}

export function categoryLabel(slug: string | null): string {
  return categoryMeta(slug).label;
}

interface Row {
  video_id: string;
  slug: string;
  title: string;
  summary: string | null;
  category: string | null;
  ingredients: RecipeIngredient[] | null;
  steps: string[] | null;
  tips: string | null;
  prep_minutes: number | null;
  cook_minutes: number | null;
  total_minutes: number | null;
  servings: number | null;
  nutrition: RecipeNutrition | null;
  keywords: string[] | null;
  image_url: string | null;
  youtube_url: string | null;
  video_published_at: Date | null;
  duration_seconds: number | null;
}

function mapRow(r: Row): Recipe {
  return {
    videoId: r.video_id,
    slug: r.slug,
    title: r.title,
    summary: r.summary,
    category: r.category,
    ingredients: Array.isArray(r.ingredients) ? r.ingredients : [],
    steps: Array.isArray(r.steps) ? r.steps : [],
    tips: r.tips,
    prepMinutes: r.prep_minutes,
    cookMinutes: r.cook_minutes,
    totalMinutes: r.total_minutes,
    servings: r.servings,
    nutrition: r.nutrition,
    keywords: Array.isArray(r.keywords) ? r.keywords : [],
    imageUrl: r.image_url,
    youtubeUrl: r.youtube_url,
    videoPublishedAt: r.video_published_at ? r.video_published_at.toISOString() : null,
    durationSeconds: r.duration_seconds,
  };
}

const SELECT = `
  SELECT video_id, slug, title, summary, category, ingredients, steps, tips,
         prep_minutes, cook_minutes, total_minutes, servings, nutrition, keywords,
         image_url, youtube_url, video_published_at, duration_seconds
    FROM published_recipes`;

/** Todas las recetas publicadas, de la más reciente a la más antigua. */
export async function getAllRecipes(): Promise<Recipe[]> {
  const { rows } = await query<Row>(
    `${SELECT} WHERE is_published = true ORDER BY video_published_at DESC NULLS LAST`
  );
  return rows.map(mapRow);
}

/** Una receta por su slug (solo si está publicada). */
export async function getRecipeBySlug(slug: string): Promise<Recipe | null> {
  const { rows } = await query<Row>(`${SELECT} WHERE slug = $1 AND is_published = true`, [slug]);
  return rows[0] ? mapRow(rows[0]) : null;
}

/** Slugs publicados (para generateStaticParams / sitemap). */
export async function getPublishedSlugs(): Promise<string[]> {
  const { rows } = await query<{ slug: string }>(
    'SELECT slug FROM published_recipes WHERE is_published = true'
  );
  return rows.map((r) => r.slug);
}

/** Recetas relacionadas de la misma categoría (excluyendo la actual). */
export async function getRelatedRecipes(
  category: string | null,
  excludeSlug: string,
  limit = 4
): Promise<Recipe[]> {
  const { rows } = await query<Row>(
    `${SELECT} WHERE is_published = true AND slug <> $1
       AND ($2::text IS NULL OR category = $2)
     ORDER BY video_published_at DESC NULLS LAST LIMIT $3`,
    [excludeSlug, category, limit]
  );
  return rows.map(mapRow);
}

/** Categorías que tienen al menos una receta publicada, con su conteo. */
export async function getCategoriesWithCounts(): Promise<{ slug: string; count: number }[]> {
  const { rows } = await query<{ category: string | null; count: string }>(
    `SELECT category, COUNT(*)::int AS count FROM published_recipes
      WHERE is_published = true GROUP BY category`
  );
  return rows
    .filter((r) => r.category)
    .map((r) => ({ slug: r.category as string, count: Number(r.count) }));
}

/** Duración ISO 8601 (para schema): minutos -> "PT15M" / "PT1H30M". */
export function isoDuration(minutes: number | null): string | undefined {
  if (!minutes || minutes <= 0) return undefined;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `PT${h ? `${h}H` : ''}${m ? `${m}M` : ''}` || undefined;
}

/** Minutos -> texto legible: "1 h 30 min" / "25 min". */
export function humanDuration(minutes: number | null): string | null {
  if (!minutes || minutes <= 0) return null;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return [h ? `${h} h` : '', m ? `${m} min` : ''].filter(Boolean).join(' ');
}

/**
 * JSON-LD de Recipe (rich results de Google). Debe coincidir con lo visible.
 * Se omiten campos vacíos; nutrition y video solo si hay datos.
 */
export function recipeJsonLd(r: Recipe): Record<string, unknown> {
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Recipe',
    name: r.title,
    description: r.summary || undefined,
    image: r.imageUrl ? [r.imageUrl] : undefined,
    author: {
      '@type': 'Organization',
      name: 'Planeta Keto',
      '@id': 'https://planetaketo.es/#organization',
    },
    datePublished: r.videoPublishedAt || undefined,
    recipeCategory: categoryLabel(r.category),
    recipeCuisine: 'Keto',
    keywords: r.keywords.length ? r.keywords.join(', ') : undefined,
    recipeYield: r.servings
      ? `${r.servings} ${r.servings === 1 ? 'ración' : 'raciones'}`
      : undefined,
    prepTime: isoDuration(r.prepMinutes),
    cookTime: isoDuration(r.cookMinutes),
    totalTime: isoDuration(r.totalMinutes),
    recipeIngredient: r.ingredients.map((i) => [i.quantity, i.item].filter(Boolean).join(' ').trim()),
    recipeInstructions: r.steps.map((s, idx) => ({
      '@type': 'HowToStep',
      position: idx + 1,
      text: s,
    })),
  };

  if (r.nutrition && r.nutrition.calories) {
    schema.nutrition = {
      '@type': 'NutritionInformation',
      calories: `${r.nutrition.calories} kcal`,
      proteinContent: r.nutrition.protein != null ? `${r.nutrition.protein} g` : undefined,
      fatContent: r.nutrition.fat != null ? `${r.nutrition.fat} g` : undefined,
      carbohydrateContent: r.nutrition.netCarbs != null ? `${r.nutrition.netCarbs} g` : undefined,
    };
  }

  if (r.youtubeUrl && r.videoId) {
    schema.video = {
      '@type': 'VideoObject',
      name: r.title,
      description: r.summary || r.title,
      thumbnailUrl: r.imageUrl ? [r.imageUrl] : undefined,
      contentUrl: r.youtubeUrl,
      embedUrl: `https://www.youtube.com/embed/${r.videoId}`,
      uploadDate: r.videoPublishedAt || undefined,
    };
  }

  // Elimina claves undefined de forma limpia.
  return JSON.parse(JSON.stringify(schema));
}
