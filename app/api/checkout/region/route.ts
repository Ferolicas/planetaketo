import { NextRequest, NextResponse } from 'next/server';
import { queryOne } from '@/lib/db';
import { getCountryFromRequest } from '@/lib/geo';
import { convertEurToCop } from '@/lib/payments/fx';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// ============================================================
// Región de cobro del visitante: decide la pasarela y los precios a mostrar.
//   country === 'CO'  → Mercado Pago, precios en COP (conversión EUR→COP en vivo)
//   resto del mundo   → Stripe, precios en EUR
//
// Precios base (EUR) desde la tabla "homeContent" (misma fuente que /api/settings
// y que el checkout). Override manual con ?force=co|world para el toggle del modal
// (una geolocalización errónea nunca debe atrapar a un comprador).
// ============================================================

const DEFAULTS = { regular: 39.75, discount: 10, percentage: 50 };

export async function GET(req: NextRequest) {
  const force = (req.nextUrl.searchParams.get('force') || '').toLowerCase();

  // 1) País
  let country: string | null = null;
  if (force === 'co') country = 'CO';
  else if (force === 'world') country = 'XX';
  else country = await getCountryFromRequest(req);

  const isColombia = country === 'CO';
  const provider: 'mercadopago' | 'stripe' = isColombia ? 'mercadopago' : 'stripe';

  // 2) Precios EUR (fuente de verdad)
  const num = (v: unknown, d: number) => (v === null || v === undefined ? d : Number(v));
  let eur = { ...DEFAULTS };
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

  // 3) Si es Colombia, añadimos COP en vivo
  let cop: { regular: number; discount: number; rate: number } | undefined;
  if (isColombia) {
    try {
      const [reg, dis] = await Promise.all([
        convertEurToCop(eur.regular),
        convertEurToCop(eur.discount),
      ]);
      cop = { regular: reg.cop, discount: dis.cop, rate: dis.rate };
    } catch (error) {
      console.error('[region] fallo conversión COP:', error);
      // Sin COP, el front mostrará EUR; el cobro MP recalcula igualmente.
    }
  }

  return NextResponse.json(
    { country, provider, prices: { eur, ...(cop ? { cop } : {}) } },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}
