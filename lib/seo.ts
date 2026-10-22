import { site } from '@/lib/site';

/**
 * Datos estructurados (JSON-LD) del sitio.
 *
 * Organization + WebSite van en el layout (toda página); Book va en la landing.
 * Sin `offers` a propósito: el precio es dinámico por país (Googlebot vería un
 * precio geolocalizado que no casaría con un precio fijo en el schema -> aviso
 * de "price mismatch"). El precio se comunica en la UI, no en el structured data.
 */

export const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  '@id': `${site.url}/#organization`,
  name: site.name,
  url: site.url,
  logo: site.logo,
  description: site.description,
  sameAs: [site.social.youtube, site.social.instagram],
  availableLanguage: 'es',
  knowsAbout: [
    'Dieta cetogénica',
    'Dieta baja en carbohidratos',
    'Recetas keto',
    'Menús keto',
    'Cetosis',
    'Cálculo de macronutrientes',
  ],
};

/** Autor de los contenidos: persona real y enlazada con la organización (señal E-E-A-T). */
export const authorSchema = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  '@id': `${site.url}/#author`,
  name: 'Ferney',
  jobTitle: 'Creador de Planeta Keto',
  worksFor: { '@id': `${site.url}/#organization` },
  url: site.url,
  sameAs: [site.social.youtube, site.social.instagram],
  knowsAbout: ['Dieta cetogénica', 'Recetas keto', 'Alimentación baja en carbohidratos'],
};

export const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  '@id': `${site.url}/#website`,
  url: site.url,
  name: site.name,
  description: site.description,
  inLanguage: site.locale,
  publisher: { '@id': `${site.url}/#organization` },
};

export const bookSchema = {
  '@context': 'https://schema.org',
  '@type': 'Book',
  '@id': `${site.url}/#book`,
  name: 'Método Keto 70 Días',
  bookFormat: 'https://schema.org/EBook',
  inLanguage: site.lang,
  image: site.bookImage,
  description:
    'El método keto definitivo de 70 días con recetas reales, calculadoras y listas de compra para perder peso sin pasar hambre.',
  author: { '@id': `${site.url}/#organization` },
  publisher: { '@id': `${site.url}/#organization` },
  about: ['Dieta cetogénica', 'Pérdida de peso', 'Recetas keto', 'Nutrición'],
};
