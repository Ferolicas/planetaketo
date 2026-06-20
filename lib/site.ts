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
} as const;

export type Site = typeof site;
