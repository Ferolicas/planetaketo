import { NextRequest, NextResponse } from 'next/server';
import { queryOne } from '@/lib/db';
import { getGeoFromRequest } from '@/lib/geo';
import { convertEur, convertEurToCop } from '@/lib/payments/fx';
import { isStripeConfigured, stripeSupportedCurrencies } from '@/lib/payments/stripe';
import catalog from '@/data/catalog.json';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

function findCatalogItem(slug: string): { slug: string; price: number; regular: number } | null {
  const all = [...(catalog.products as { slug: string; price: number; regular: number }[]),
    ...(catalog.bundles as { slug: string; price: number; regular: number }[])];
  return all.find((x) => x.slug === slug) ?? null;
}

// ============================================================
// Región de cobro del visitante: pasarela + precios en su MONEDA LOCAL.
//   country === 'CO'  → Mercado Pago, precios en COP
//   resto del mundo   → Stripe (moneda local si Stripe la soporta; si no, USD/EUR)
// Los precios se muestran en la moneda local detectada; si no se puede
// determinar o convertir, se muestran en EUR.
//
// Precio base (EUR) desde "homeContent". Conversión EUR→moneda local EN VIVO.
// Override manual con ?force=co|world (debug). El frontend formatea con Intl.
// ============================================================

const DEFAULTS = { regular: 39.75, discount: 10, percentage: 50 };

interface LocalPrices {
  currency: string;
  regular: number;
  discount: number;
  rate: number;
}

export async function GET(req: NextRequest) {
  const force = (req.nextUrl.searchParams.get('force') || '').toLowerCase();

  // 1) País + moneda local
  let country: string | null = null;
  let currency: string | null = null;
  if (force === 'co') {
    country = 'CO';
    currency = 'COP';
  } else if (force === 'world') {
    // Compatibilidad del modo QA histórico: simula Europa/Stripe.
    country = (req.nextUrl.searchParams.get('cc') || 'ES').toUpperCase();
    currency = (req.nextUrl.searchParams.get('cur') || 'EUR').toUpperCase();
  } else if (force === 'latam') {
    // Depuración: simula un país LATAM (≠ Colombia) → Stripe.
    country = (req.nextUrl.searchParams.get('cc') || 'PE').toUpperCase();
    currency = (req.nextUrl.searchParams.get('cur') || 'PEN').toUpperCase();
  } else {
    const geo = await getGeoFromRequest(req);
    country = geo.country;
    currency = geo.currency;
  }

  const slug = req.nextUrl.searchParams.get('slug');
  const item = slug ? findCatalogItem(slug) : null;
  if (slug && !item) {
    return NextResponse.json({ error: 'unknown_product' }, { status: 400 });
  }
  const isColombia = country === 'CO';
  const provider: 'mercadopago' | 'stripe' = isColombia ? 'mercadopago' : 'stripe';

  // 2) Precios base en EUR (fuente de verdad). Si llega ?slug= de un producto del
  // catálogo, esos precios; si no, el método keto por defecto (tabla homeContent).
  const num = (v: unknown, d: number) => (v === null || v === undefined ? d : Number(v));
  let eur = { ...DEFAULTS };
  if (item) {
    eur = {
      regular: item.regular,
      discount: item.price,
      percentage: Math.round((1 - item.price / item.regular) * 100),
    };
  } else {
    try {
      const row = await queryOne<{
        regular_price: string | number | null;
        discount_price: string | number | null;
        discount_percentage: string | number | null;
      }>(
        `SELECT regular_price, discount_price, discount_percentage
         FROM "homeContent" WHERE id = 'default'`
      );
      eur = {
        regular: num(row?.regular_price, DEFAULTS.regular),
        discount: num(row?.discount_price, DEFAULTS.discount),
        percentage: num(row?.discount_percentage, DEFAULTS.percentage),
      };
    } catch (error) {
      console.error('[region] fallo leyendo precios, uso defaults:', error);
    }
  }

  // 3) Precios en la moneda local
  let targetCurrency = (isColombia ? 'COP' : currency || 'EUR').toUpperCase();
  // Stripe: misma regla que /api/checkout/stripe, para que el precio mostrado sea
  // EXACTAMENTE la moneda en la que se cobra (moneda local si Stripe la soporta;
  // si no, USD y, en último caso, EUR).
  if (provider === 'stripe' && targetCurrency !== 'EUR' && isStripeConfigured()) {
    const supported = await stripeSupportedCurrencies();
    if (!supported.has(targetCurrency)) targetCurrency = supported.has('USD') ? 'USD' : 'EUR';
  }
  let local: LocalPrices = { currency: 'EUR', regular: eur.regular, discount: eur.discount, rate: 1 };

  try {
    if (isColombia) {
      const [reg, dis] = await Promise.all([
        convertEurToCop(eur.regular),
        convertEurToCop(eur.discount),
      ]);
      local = { currency: 'COP', regular: reg.cop, discount: dis.cop, rate: dis.rate };
    } else if (targetCurrency !== 'EUR') {
      const [reg, dis] = await Promise.all([
        convertEur(eur.regular, targetCurrency),
        convertEur(eur.discount, targetCurrency),
      ]);
      if (reg && dis) {
        local = { currency: targetCurrency, regular: reg.amount, discount: dis.amount, rate: dis.rate };
      }
    }
  } catch (error) {
    console.error('[region] fallo conversión de moneda, uso EUR:', error);
  }

  return NextResponse.json(
    { country, provider, currency: local.currency, prices: { eur, local } },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}
