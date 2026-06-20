import { query } from '@/lib/db';
import { site } from '@/lib/site';

// ============================================================
// Capa de datos de blogs (Fase 3). La web lee solo los publicados.
// ============================================================

export interface BlogPost {
  id: number;
  slug: string;
  title: string;
  summary: string | null;
  content: string;
  category: string | null;
  keywords: string[];
  sourceName: string | null;
  sourceUrl: string | null;
  heroImage: string | null;
  status: string;
  author: string;
  publishedAt: string | null;
  updatedAt: string | null;
}

export const BLOG_CATEGORIES: { slug: string; label: string; emoji: string }[] = [
  { slug: 'ciencia', label: 'Ciencia keto', emoji: '🔬' },
  { slug: 'nutricion', label: 'Nutrición', emoji: '🥑' },
  { slug: 'salud', label: 'Salud', emoji: '❤️' },
  { slug: 'perdida-de-peso', label: 'Pérdida de peso', emoji: '⚖️' },
  { slug: 'mitos', label: 'Mitos', emoji: '🧩' },
  { slug: 'principiantes', label: 'Principiantes', emoji: '🌱' },
];

export function blogCategoryMeta(slug: string | null): { label: string; emoji: string } {
  const f = BLOG_CATEGORIES.find((c) => c.slug === slug);
  if (f) return { label: f.label, emoji: f.emoji };
  const s = (slug ?? 'keto').trim();
  return { label: s ? s.charAt(0).toUpperCase() + s.slice(1) : 'Keto', emoji: '📄' };
}

export function blogSlugify(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Mn}/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

interface Row {
  id: string | number;
  slug: string;
  title: string;
  summary: string | null;
  content: string;
  category: string | null;
  keywords: string[] | null;
  source_name: string | null;
  source_url: string | null;
  hero_image: string | null;
  status: string;
  author: string;
  published_at: Date | null;
  updated_at: Date | null;
}

function mapRow(r: Row): BlogPost {
  return {
    id: Number(r.id),
    slug: r.slug,
    title: r.title,
    summary: r.summary,
    content: r.content,
    category: r.category,
    keywords: Array.isArray(r.keywords) ? r.keywords : [],
    sourceName: r.source_name,
    sourceUrl: r.source_url,
    heroImage: r.hero_image,
    status: r.status,
    author: r.author,
    publishedAt: r.published_at ? r.published_at.toISOString() : null,
    updatedAt: r.updated_at ? r.updated_at.toISOString() : null,
  };
}

const SELECT = `
  SELECT id, slug, title, summary, content, category, keywords, source_name, source_url,
         hero_image, status, author, published_at, updated_at
    FROM blog_posts`;

export async function getPublishedPosts(): Promise<BlogPost[]> {
  const { rows } = await query<Row>(
    `${SELECT} WHERE status = 'published' ORDER BY published_at DESC NULLS LAST`
  );
  return rows.map(mapRow);
}

export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  const { rows } = await query<Row>(`${SELECT} WHERE slug = $1 AND status = 'published'`, [slug]);
  return rows[0] ? mapRow(rows[0]) : null;
}

export async function getPublishedBlogSlugs(): Promise<string[]> {
  const { rows } = await query<{ slug: string }>(
    `SELECT slug FROM blog_posts WHERE status = 'published'`
  );
  return rows.map((r) => r.slug);
}

export async function getRelatedPosts(excludeSlug: string, limit = 3): Promise<BlogPost[]> {
  const { rows } = await query<Row>(
    `${SELECT} WHERE status = 'published' AND slug <> $1 ORDER BY published_at DESC NULLS LAST LIMIT $2`,
    [excludeSlug, limit]
  );
  return rows.map(mapRow);
}

/** JSON-LD BlogPosting (con la fuente citada). Imagen con fallback al OG del sitio. */
export function articleJsonLd(p: BlogPost): Record<string, unknown> {
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: p.title,
    description: p.summary || undefined,
    image: [p.heroImage || site.bookImage],
    datePublished: p.publishedAt || undefined,
    dateModified: p.updatedAt || p.publishedAt || undefined,
    author: { '@type': 'Organization', name: 'Planeta Keto', '@id': `${site.url}/#organization` },
    publisher: { '@id': `${site.url}/#organization` },
    mainEntityOfPage: `${site.url}/blog/${p.slug}`,
    keywords: p.keywords.length ? p.keywords.join(', ') : undefined,
  };
  if (p.sourceUrl) {
    schema.citation = {
      '@type': 'CreativeWork',
      name: p.sourceName || p.sourceUrl,
      url: p.sourceUrl,
    };
  }
  return JSON.parse(JSON.stringify(schema));
}
