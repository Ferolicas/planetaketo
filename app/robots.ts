import type { MetadataRoute } from 'next';
import { site } from '@/lib/site';

/**
 * robots.txt servido por la app, declarando el sitemap nuevo.
 * Permite el rastreo de todo el contenido público; bloquea solo rutas privadas/
 * transaccionales (admin, API, login, entrega de descargas, redirecciones).
 *
 * NOTA: Cloudflare añade su propio bloque "Managed content" (bots de IA) al final.
 * Tras desplegar hay que verificar que la directiva `Sitemap:` aparece en vivo.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/ferney', '/api/', '/login', '/reset-password', '/download/', '/r/'],
      },
    ],
    sitemap: `${site.url}/sitemap.xml`,
    host: site.url,
  };
}
