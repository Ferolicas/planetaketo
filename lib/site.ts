/**
 * Configuración central del sitio Planeta Keto.
 * Punto único de verdad para SEO, sitemap, robots y structured data (JSON-LD).
 */
export const site = {
  /** Dominio canónico OFICIAL, sin www y sin barra final. */
  url: 'https://planetaketo.es',
  name: 'Planeta Keto',
  locale: 'es-ES',
  lang: 'es',
  description:
    'El método keto definitivo para perder peso sin pasar hambre, con recetas reales, calculadoras y listas de compra. Acceso de por vida.',
  /** Logo de marca (para schema Organization). */
  logo: 'https://planetaketo.es/LOGO.png',
  /** Portada del libro (para schema Book/Product y Open Graph). */
  bookImage: 'https://planetaketo.es/libro.png',
  /** Perfiles públicos (señal sameAs para Google). */
  social: {
    youtube: 'https://youtube.com/@planetaketo',
    instagram: 'https://instagram.com/planetaketo',
  },
  /** Datos del canal de YouTube para banners y galería de recetas. */
  youtube: {
    channelUrl: 'https://youtube.com/@planetaketo',
    subscribeUrl: 'https://youtube.com/@planetaketo?sub_confirmation=1',
    longVideoId: '82bY8byKzVI',
    playlistId: 'PLZ8wIuDyp-hF9Jgyy0H9NfhkRvCvre5MG',
    playlistUrl:
      'https://www.youtube.com/watch?v=pnPt9DUhz2w&list=PLZ8wIuDyp-hF9Jgyy0H9NfhkRvCvre5MG',
  },
} as const;

export type Site = typeof site;

/** ca-pub-… de AdSense; vacío hasta activarlo. Solo en recetas/blogs, NUNCA en la landing. */
export const adsenseClient = process.env.NEXT_PUBLIC_ADSENSE_CLIENT ?? '';
