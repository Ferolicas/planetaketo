'use client';

import { useEffect, useState } from 'react';

// ============================================================
// Región de cobro del visitante (pasarela + precios en su MONEDA LOCAL),
// consumida por el modal de pago y por los precios de la home. Habla con
// /api/checkout/region.
//   Colombia → Mercado Pago (COP) · resto → Stripe (moneda local del país)
// ============================================================

export interface LocalPrices {
  currency: string; // ISO 4217 (EUR, PEN, MXN, CLP, COP…)
  regular: number;
  discount: number;
  rate: number;
}

export interface RegionPrices {
  eur: { regular: number; discount: number; percentage: number };
  local: LocalPrices;
}

export interface CheckoutRegion {
  country: string | null;
  provider: 'stripe' | 'mercadopago';
  currency: string;
  prices: RegionPrices;
}

export const REGION_FALLBACK: CheckoutRegion = {
  country: null,
  provider: 'stripe',
  currency: 'EUR',
  prices: {
    eur: { regular: 39.75, discount: 10, percentage: 50 },
    local: { currency: 'EUR', regular: 39.75, discount: 10, rate: 1 },
  },
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
  currency: string;
  discount: number;
  regular: number;
  percentage: number;
  fmt: (n: number) => string;
}

/** Precios + formateador en la moneda local (Intl pone símbolo y decimales). */
export function regionDisplay(region: CheckoutRegion | null): PriceDisplay {
  const local = region?.prices?.local ?? REGION_FALLBACK.prices.local;
  const currency = local.currency || 'EUR';

  const fmt = (n: number) => {
    try {
      return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(n);
    } catch {
      return `${n.toFixed(2)} ${currency}`;
    }
  };

  return {
    currency,
    discount: local.discount,
    regular: local.regular,
    percentage: region?.prices.eur.percentage ?? REGION_FALLBACK.prices.eur.percentage,
    fmt,
  };
}
