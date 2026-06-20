import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { query } from '@/lib/db';
import { getSession } from '@/lib/auth/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function isAdmin(): Promise<boolean> {
  const s = await getSession();
  return !!s && s.user.role === 'admin';
}

// Lista TODAS las recetas (publicadas y ocultas) para el panel.
export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { rows } = await query(
    `SELECT video_id, slug, title, summary, category, ingredients, steps, tips,
            prep_minutes, cook_minutes, total_minutes, servings, nutrition, keywords,
            image_url, youtube_url, is_published, edited, video_published_at
       FROM published_recipes
      ORDER BY video_published_at DESC NULLS LAST`
  );
  return NextResponse.json({ recipes: rows });
}

const EditSchema = z.object({
  videoId: z.string().min(1),
  title: z.string().min(1),
  summary: z.string().nullable().optional(),
  category: z.string().nullable().optional(),
  ingredients: z.array(z.object({ quantity: z.string().default(''), item: z.string() })),
  steps: z.array(z.string()),
  tips: z.string().nullable().optional(),
  prepMinutes: z.number().int().nullable().optional(),
  cookMinutes: z.number().int().nullable().optional(),
  servings: z.number().int().nullable().optional(),
  nutrition: z
    .object({
      calories: z.number().nullable(),
      protein: z.number().nullable(),
      fat: z.number().nullable(),
      netCarbs: z.number().nullable(),
    })
    .nullable()
    .optional(),
  isPublished: z.boolean(),
});

// PATCH: o bien { action:'toggle', videoId, isPublished } (ocultar/mostrar),
// o bien el payload completo de edición (marca edited=true).
export async function PATCH(req: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });

  if (body.action === 'toggle') {
    if (!body.videoId) return NextResponse.json({ error: 'videoId requerido' }, { status: 400 });
    await query('UPDATE published_recipes SET is_published = $2, updated_at = now() WHERE video_id = $1', [
      body.videoId,
      !!body.isPublished,
    ]);
    return NextResponse.json({ ok: true });
  }

  const parsed = EditSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const r = parsed.data;
  const total = (r.prepMinutes ?? 0) + (r.cookMinutes ?? 0) || null;
  await query(
    `UPDATE published_recipes SET
       title=$2, summary=$3, category=$4, ingredients=$5::jsonb, steps=$6::jsonb, tips=$7,
       prep_minutes=$8, cook_minutes=$9, total_minutes=$10, servings=$11, nutrition=$12::jsonb,
       is_published=$13, edited=true, updated_at=now()
     WHERE video_id = $1`,
    [
      r.videoId,
      r.title,
      r.summary ?? null,
      r.category ?? null,
      JSON.stringify(r.ingredients),
      JSON.stringify(r.steps),
      r.tips ?? null,
      r.prepMinutes ?? null,
      r.cookMinutes ?? null,
      total,
      r.servings ?? null,
      r.nutrition ? JSON.stringify(r.nutrition) : null,
      r.isPublished,
    ]
  );
  return NextResponse.json({ ok: true });
}
