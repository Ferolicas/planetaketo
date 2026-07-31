import manifest from '@/data/hotmart-products.json';

export const HOTMART_DEFAULT_PRODUCT_SLUG = 'metodo-keto';

export interface HotmartProductConfig {
  productId: number;
  ucode: string;
  offerId: number;
  offerCode: string;
  price: number;
  currency: string;
  checkoutUrl: string;
}

const PRODUCTS = manifest.products as Record<string, HotmartProductConfig>;

function validHotmartCheckoutUrl(value: string): string {
  if (!value) return '';
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && url.hostname === 'pay.hotmart.com'
      ? url.toString()
      : '';
  } catch {
    return '';
  }
}

export function getHotmartProduct(
  productSlug?: string | null
): HotmartProductConfig | null {
  const slug = productSlug || HOTMART_DEFAULT_PRODUCT_SLUG;
  return PRODUCTS[slug] ?? null;
}

export function getHotmartProductById(
  productId: string | number | null | undefined
): { slug: string; config: HotmartProductConfig } | null {
  if (productId === null || productId === undefined) return null;
  const expected = String(productId);
  for (const [slug, config] of Object.entries(PRODUCTS)) {
    if (String(config.productId) === expected) return { slug, config };
  }
  return null;
}

export function getHotmartCheckoutUrl(productSlug?: string | null): string {
  const product = getHotmartProduct(productSlug);
  return product ? validHotmartCheckoutUrl(product.checkoutUrl) : '';
}

export function hasHotmartCheckout(productSlug?: string | null): boolean {
  return Boolean(getHotmartCheckoutUrl(productSlug));
}
