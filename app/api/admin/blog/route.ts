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

// Lista TODOS los posts (borradores incluidos) para el panel de revisión.
export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { rows } = await query(
    `SELECT id, slug, title, summary, content, category, keywords, source_name, source_url,
            hero_image, status, author, created_at, published_at
       FROM blog_posts
      ORDER BY (status = 'draft') DESC, created_at DESC`
  );
  return NextResponse.json({ posts: rows });
}

const EditSchema = z.object({
  id: z.number().int(),
  title: z.string().min(4),
  summary: z.string().nullable().optional(),
  content: z.string().min(20),
  category: z.string().nullable().optional(),
  keywords: z.array(z.string()).optional().default([]),
  sourceName: z.string().nullable().optional(),
  sourceUrl: z.string().nullable().optional(),
  status: z.enum(['draft', 'published']),
});

// PATCH: { action:'publish'|'unpublish'|'delete', id } o el payload completo de edición.
export async function PATCH(req: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });

  if (body.action && body.id) {
    if (body.action === 'delete') {
      await query('DELETE FROM blog_posts WHERE id = $1', [body.id]);
      return NextResponse.json({ ok: true });
    }
    if (body.action === 'publish') {
      await query(
        `UPDATE blog_posts SET status='published',
           published_at = COALESCE(published_at, now()), updated_at = now() WHERE id = $1`,
        [body.id]
      );
      return NextResponse.json({ ok: true });
    }
    if (body.action === 'unpublish') {
      await query(`UPDATE blog_posts SET status='draft', updated_at = now() WHERE id = $1`, [body.id]);
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json({ error: 'Acción no válida' }, { status: 400 });
  }

  const parsed = EditSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const p = parsed.data;
  await query(
    `UPDATE blog_posts SET
       title=$2, summary=$3, content=$4, category=$5, keywords=$6::text[],
       source_name=$7, source_url=$8, status=$9,
       published_at = CASE WHEN $9 = 'published' THEN COALESCE(published_at, now()) ELSE published_at END,
       updated_at = now()
     WHERE id = $1`,
    [
      p.id,
      p.title,
      p.summary ?? null,
      p.content,
      p.category ?? null,
      p.keywords ?? [],
      p.sourceName ?? null,
      p.sourceUrl ?? null,
      p.status,
    ]
  );
  return NextResponse.json({ ok: true });
}
