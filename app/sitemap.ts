import type { MetadataRoute } from 'next';
import { site } from '@/lib/site';
import { getPublishedSlugs } from '@/lib/recipes';
import { getPublishedBlogSlugs } from '@/lib/blog';

export const revalidate = 3600;

/**
 * Sitemap dinámico — páginas reales + recetas + blogs publicados (autoinyectados
 * desde la BD). El contenido nuevo (cron de recetas, n8n de blogs) entra solo.
 */
async function recipeSlugs(): Promise<string[]> {
  try {
    return await getPublishedSlugs();
  } catch {
    return [];
  }
}
async function blogSlugs(): Promise<string[]> {
  try {
    return await getPublishedBlogSlugs();
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const [recetas, blogs] = await Promise.all([recipeSlugs(), blogSlugs()]);

  const recetaUrls: MetadataRoute.Sitemap = recetas.map((slug) => ({
    url: `${site.url}/recetas/${slug}`,
    lastModified: now,
    changeFrequency: 'monthly',
    priority: 0.8,
  }));
  const blogUrls: MetadataRoute.Sitemap = blogs.map((slug) => ({
    url: `${site.url}/blog/${slug}`,
    lastModified: now,
    changeFrequency: 'monthly',
    priority: 0.7,
  }));

  return [
    { url: `${site.url}`, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${site.url}/recetas`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: `${site.url}/blog`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    ...recetaUrls,
    ...blogUrls,
    { url: `${site.url}/aviso-legal`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${site.url}/privacidad`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${site.url}/cookies`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
  ];
}
