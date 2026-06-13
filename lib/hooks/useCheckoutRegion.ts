'use client';

import { useEffect, useState } from 'react';

// ============================================================
// Región de cobro del visitante (provider + precios), consumida por el modal de
// pago y por los precios de la home. Habla con /api/checkout/region.
//   provider 'mercadopago' (Colombia) → precios en COP (conversión EUR→COP viva)
//   provider 'stripe' (resto)         → precios en EUR
// ============================================================

export interface RegionPrices {
  eur: { regular: number; discount: number; percentage: number };
  cop?: { regular: number; discount: number; rate: number };
}

export interface CheckoutRegion {
  country: string | null;
  provider: 'stripe' | 'mercadopago';
  prices: RegionPrices;
}

export const REGION_FALLBACK: CheckoutRegion = {
  country: null,
  provider: 'stripe',
  prices: { eur: { regular: 39.75, discount: 10, percentage: 50 } },
};

export async function fetchRegion(force?: 'co' | 'world'): Promise<CheckoutRegion> {
  const url = '/api/checkout/region' + (force ? `?force=${force}` : '');
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error('region_fetch_failed');
  return (await res.json()) as CheckoutRegion;
}

/** Hook: detecta la región una vez (o cuando cambia `force`). */
export function useCheckoutRegion(force?: 'co' | 'world') {
  const [region, setRegion] = useState<CheckoutRegion | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    fetchRegion(force)
      .then((r) => alive && setRegion(r))
      .catch(() => alive && setRegion(REGION_FALLBACK))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [force]);

  return { region, loading };
}

export interface PriceDisplay {
  currency: 'EUR' | 'COP';
  discount: number;
  regular: number;
  percentage: number;
  fmt: (n: number) => string;
}

/** Precios + formateador de moneda según la región (€ o $ COP). */
export function regionDisplay(region: CheckoutRegion | null): PriceDisplay {
  if (region?.provider === 'mercadopago' && region.prices.cop) {
    return {
      currency: 'COP',
      discount: region.prices.cop.discount,
      regular: region.prices.cop.regular,
      percentage: region.prices.eur.percentage,
      fmt: (n) => '$' + Math.round(n).toLocaleString('es-CO'),
    };
  }
  const eur = region?.prices.eur ?? REGION_FALLBACK.prices.eur;
  return {
    currency: 'EUR',
    discount: eur.discount,
    regular: eur.regular,
    percentage: eur.percentage,
    fmt: (n) => '€' + n.toFixed(2),
  };
}
