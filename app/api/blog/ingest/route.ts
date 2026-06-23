import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { query } from '@/lib/db';
import { blogSlugify } from '@/lib/blog';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Endpoint para que n8n deposite el borrador diario (status='draft').
// Protegido por secreto compartido: cabecera `x-ingest-secret` == BLOG_INGEST_SECRET.

const Schema = z.object({
  title: z.string().min(4),
  content: z.string().min(50), // Markdown
  summary: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  keywords: z.array(z.string()).optional().default([]),
  sourceName: z.string().optional().nullable(),
  sourceUrl: z.string().url().optional().nullable(),
  heroImage: z.string().url().optional().nullable(),
  model: z.string().optional().nullable(),
  // Slug SEO opcional: si llega, se usa ese (keyword exacta) en vez de derivarlo del título.
  slug: z.string().min(2).max(80).optional().nullable(),
});

async function uniqueSlug(base: string): Promise<string> {
  const root = base || `post-${Date.now()}`;
  let slug = root;
  for (let n = 2; n < 60; n++) {
    const r = await query<{ id: number }>('SELECT id FROM blog_posts WHERE slug = $1', [slug]);
    if (r.rowCount === 0) return slug;
    slug = `${root}-${n}`;
  }
  return `${root}-${Date.now()}`;
}

export async function POST(req: NextRequest) {
  const secret = process.env.BLOG_INGEST_SECRET;
  if (!secret || req.headers.get('x-ingest-secret') !== secret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const parsed = Schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const d = parsed.data;
  const slug = await uniqueSlug(blogSlugify(d.slug || d.title));

  const { rows } = await query<{ id: number }>(
    `INSERT INTO blog_posts
       (slug, title, summary, content, category, keywords, source_name, source_url, hero_image, status, model, updated_at)
     VALUES ($1,$2,$3,$4,$5,$6::text[],$7,$8,$9,'draft',$10, now())
     RETURNING id`,
    [
      slug,
      d.title,
      d.summary ?? null,
      d.content,
      d.category ?? null,
      d.keywords ?? [],
      d.sourceName ?? null,
      d.sourceUrl ?? null,
      d.heroImage ?? null,
      d.model ?? null,
    ]
  );

  return NextResponse.json({ ok: true, id: rows[0]?.id, slug, status: 'draft' });
}
