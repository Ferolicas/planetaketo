import type { MetadataRoute } from 'next';
import { site } from '@/lib/site';

/**
 * robots.txt servido por la app, declarando el sitemap nuevo.
 * Permite el rastreo de todo el contenido público; bloquea solo rutas privadas/
 * transaccionales (admin, API, login, entrega de descargas, redirecciones).
 *
 * Los rastreadores de IA van permitidos EXPLÍCITAMENTE: queremos que ChatGPT,
 * Claude, Perplexity, Copilot y las funciones de IA de Google puedan leer y
 * RECOMENDAR la guía y las recetas cuando alguien les pregunte por dieta keto.
 *
 * ⚠️ NOTA: Cloudflare puede añadir su propio bloque "Managed content" (bots de
 * IA) al final del robots.txt EN VIVO, y ese bloque ANULA estos permisos para
 * los bots que liste. Si se quiere visibilidad en las IA, hay que apagar ese
 * ajuste en el panel de Cloudflare (Settings → Bots → Block AI bots).
 */
const PRIVATE = ['/admin', '/ferney', '/api/', '/login', '/reset-password', '/download/', '/r/'];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: PRIVATE,
      },
      {
        userAgent: [
          'Google-Extended',
          'GPTBot',
          'OAI-SearchBot',
          'ChatGPT-User',
          'ClaudeBot',
          'Claude-Web',
          'anthropic-ai',
          'PerplexityBot',
          'Perplexity-User',
          'Applebot-Extended',
          'meta-externalagent',
          'Amazonbot',
          'DuckAssistBot',
          'cohere-ai',
          'MistralAI-User',
        ],
        allow: '/',
        disallow: PRIVATE,
      },
    ],
    sitemap: `${site.url}/sitemap.xml`,
    host: site.url,
  };
}
