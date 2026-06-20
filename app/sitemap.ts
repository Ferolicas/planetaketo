import type { MetadataRoute } from 'next';
import { site } from '@/lib/site';

/**
 * Sitemap LIMPIO — solo páginas reales e indexables.
 * Sustituye a los 3 sitemaps rotos de noviembre (www/sitemap-*.xml) que generaba
 * el sistema viejo de doorway pages.
 *
 * Las recetas (/recetas/[slug]) y los blogs (/blog/[slug]) se autoinyectarán aquí
 * en las Fases 2 y 3 a partir de la BD, para tener contenido fresco perpetuo.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return [
    { url: `${site.url}`, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${site.url}/aviso-legal`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${site.url}/privacidad`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${site.url}/cookies`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
  ];
}
