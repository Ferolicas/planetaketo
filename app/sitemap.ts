import type { MetadataRoute } from 'next';
import { site } from '@/lib/site';
import { getSitemapRecipes } from '@/lib/recipes';
import { getSitemapPosts } from '@/lib/blog';

export const revalidate = 3600;

/**
 * Sitemap dinámico y completo: todas las páginas reales, recetas y artículos
 * publicados, cada uno con su fecha REAL de modificación (Google ignora lastmod
 * si es siempre «hoy») y su imagen principal (sitemap de imágenes). El contenido
 * nuevo (cron de recetas, blogs) entra solo.
 */
type Item = { slug: string; updatedAt: Date; image: string | null };

async function safe(fn: () => Promise<Item[]>): Promise<Item[]> {
  try {
    return await fn();
  } catch {
    return [];
  }
}

function abs(url: string | null): string[] | undefined {
  if (!url) return undefined;
  if (/^https?:\/\//i.test(url)) return [url];
  return [`${site.url}${url.startsWith('/') ? '' : '/'}${url}`];
}

function newest(items: Item[]): Date | undefined {
  return items.reduce<Date | undefined>((a, i) => (!a || i.updatedAt > a ? i.updatedAt : a), undefined);
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [recetas, blogs] = await Promise.all([safe(getSitemapRecipes), safe(getSitemapPosts)]);
  const lastRecipe = newest(recetas);
  const lastPost = newest(blogs);
  const lastAny = [lastRecipe, lastPost].filter(Boolean).sort((a, b) => b!.getTime() - a!.getTime())[0];

  const recetaUrls: MetadataRoute.Sitemap = recetas.map((r) => ({
    url: `${site.url}/recetas/${r.slug}`,
    lastModified: r.updatedAt,
    changeFrequency: 'monthly',
    priority: 0.8,
    images: abs(r.image),
  }));
  const blogUrls: MetadataRoute.Sitemap = blogs.map((b) => ({
    url: `${site.url}/blog/${b.slug}`,
    lastModified: b.updatedAt,
    changeFrequency: 'monthly',
    priority: 0.7,
    images: abs(b.image),
  }));

  return [
    { url: `${site.url}`, lastModified: lastAny, changeFrequency: 'weekly', priority: 1, images: abs(site.bookImage) },
    // Página pilar: la guía que compite por «dieta keto» / «dieta cetogénica».
    { url: `${site.url}/dieta-keto`, lastModified: lastAny, changeFrequency: 'weekly', priority: 0.95 },
    { url: `${site.url}/dieta-keto-gratis`, lastModified: lastRecipe ?? lastAny, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${site.url}/recetas`, lastModified: lastRecipe, changeFrequency: 'daily', priority: 0.9 },
    { url: `${site.url}/blog`, lastModified: lastPost, changeFrequency: 'daily', priority: 0.9 },
    ...recetaUrls,
    ...blogUrls,
    { url: `${site.url}/aviso-legal`, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${site.url}/privacidad`, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${site.url}/cookies`, changeFrequency: 'yearly', priority: 0.3 },
  ];
}
