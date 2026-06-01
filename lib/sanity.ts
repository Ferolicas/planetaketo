// ============================================================
// Cliente Sanity (solo lectura) — server-side
// ============================================================
// Sin dependencias: usa la HTTP API de Sanity para GROQ y para
// servir el asset del PDF por proxy desde el backend.
//
// El catálogo (precio, stripePriceId, PDF) vive en Sanity. Hay dos
// documentos `product` categoría "Libro":
//   - GRATIS: price == 0  (slug: planificador-7-dias)        -> lead magnet
//   - PAGO:   price  > 0  (slug: metodo-keto-70-dias-...)     -> libro completo
// El campo del PDF es `pdfFile` (tipo file) en ambos.

const PROJECT_ID = process.env.SANITY_PROJECT_ID;
const DATASET = process.env.SANITY_DATASET || 'production';
const TOKEN = process.env.SANITY_API_TOKEN;
const API_VERSION = '2021-10-21';

function apiBase(): string {
  if (!PROJECT_ID) throw new Error('SANITY_PROJECT_ID no está definido');
  return `https://${PROJECT_ID}.api.sanity.io/v${API_VERSION}/data/query/${DATASET}`;
}

/** Ejecuta una consulta GROQ y devuelve el `result`. */
export async function sanityQuery<T>(
  groq: string,
  params: Record<string, unknown> = {}
): Promise<T> {
  const url = new URL(apiBase());
  url.searchParams.set('query', groq);
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(`$${k}`, JSON.stringify(v));
  }

  const res = await fetch(url.toString(), {
    headers: TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {},
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error(`Sanity query failed: ${res.status} ${res.statusText}`);
  }
  const json = (await res.json()) as { result: T };
  return json.result;
}

export interface ProductPdf {
  id: string;
  title: string;
  slug: string;
  price: number;
  stripePriceId: string | null;
  pdfUrl: string | null;
  fileName: string | null;
  mimeType: string | null;
}

const PRODUCT_PROJECTION = `{
  "id": _id,
  title,
  "slug": slug.current,
  price,
  stripePriceId,
  "pdfUrl": pdfFile.asset->url,
  "fileName": pdfFile.asset->originalFilename,
  "mimeType": pdfFile.asset->mimeType
}`;

/** Producto de PAGO (price > 0). Slug por defecto sirve de respaldo. */
export async function getPaidProduct(): Promise<ProductPdf | null> {
  return sanityQuery<ProductPdf | null>(
    `*[_type == "product" && price > 0] | order(price desc)[0] ${PRODUCT_PROJECTION}`
  );
}

/** Producto GRATIS (price == 0) = lead magnet. */
export async function getFreeProduct(): Promise<ProductPdf | null> {
  return sanityQuery<ProductPdf | null>(
    `*[_type == "product" && price == 0] | order(_updatedAt desc)[0] ${PRODUCT_PROJECTION}`
  );
}

export async function getProductBySlug(slug: string): Promise<ProductPdf | null> {
  return sanityQuery<ProductPdf | null>(
    `*[_type == "product" && slug.current == $slug][0] ${PRODUCT_PROJECTION}`,
    { slug }
  );
}

/**
 * Descarga los bytes del asset PDF desde el CDN de Sanity.
 * Funciona con dataset público; si fuese privado, reintenta con el token.
 */
export async function fetchSanityFile(pdfUrl: string): Promise<ArrayBuffer> {
  let res = await fetch(pdfUrl, { cache: 'no-store' });
  if (!res.ok && TOKEN) {
    const sep = pdfUrl.includes('?') ? '&' : '?';
    res = await fetch(`${pdfUrl}${sep}token=${TOKEN}`, { cache: 'no-store' });
  }
  if (!res.ok) {
    throw new Error(`No se pudo obtener el asset de Sanity: ${res.status}`);
  }
  return res.arrayBuffer();
}
