import type { MetadataRoute } from 'next';
import { site } from '@/lib/site';
import { getPublishedSlugs } from '@/lib/recipes';

export const revalidate = 3600;

/**
 * Sitemap dinámico — páginas reales + recetas publicadas (autoinyectadas desde
 * la BD). Las recetas nuevas (cron de Fase 2) aparecen aquí solas.
 */
async function recipeSlugs(): Promise<string[]> {
  try {
    return await getPublishedSlugs();
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const slugs = await recipeSlugs();

  const recetas: MetadataRoute.Sitemap = slugs.map((slug) => ({
    url: `${site.url}/recetas/${slug}`,
    lastModified: now,
    changeFrequency: 'monthly',
    priority: 0.8,
  }));

  return [
    { url: `${site.url}`, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${site.url}/recetas`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    ...recetas,
    { url: `${site.url}/aviso-legal`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${site.url}/privacidad`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${site.url}/cookies`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
  ];
}
