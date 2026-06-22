import { NextRequest, NextResponse } from 'next/server';
import {
  getStripe,
  isStripeConfigured,
  toStripeAmount,
  stripeSupportedCurrencies,
} from '@/lib/payments/stripe';
import { PRODUCT_CONFIG } from '@/lib/product';
import { queryOne } from '@/lib/db';
import { getGeoFromRequest } from '@/lib/geo';
import { convertEur } from '@/lib/payments/fx';
import { markCheckoutStarted } from '@/lib/analytics/session-link';
import { enforceRateLimit } from '@/lib/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// ============================================================
// Stripe Payment Element — crea un PaymentIntent en la MONEDA LOCAL del visitante
// (presentment currency) y devuelve su client_secret. La cuenta es española
// (liquida en EUR) pero Stripe permite cobrar en la moneda del comprador.
//
// Precio base en EUR desde "homeContent".discount_price → convertido EN VIVO a la
// moneda local. Si la moneda no se detecta o no es soportada/convertible → EUR.
// La entrega la dispara el webhook (payment_intent.succeeded) vía finalizeSale().
// ============================================================
export async function POST(req: NextRequest) {
  const limited = enforceRateLimit(req, 'checkout', 20, 5 * 60_000);
  if (limited) return limited;

  if (!isStripeConfigured()) {
    console.error('[stripe] STRIPE_SECRET_KEY no configurada');
    return NextResponse.json({ error: 'not_configured' }, { status: 500 });
  }

  // UUID de la visita (analítica) para enlazar la venta. Opcional.
  let sessionId: string | null = null;
  try {
    const body = (await req.json()) as { sessionId?: unknown };
    if (typeof body?.sessionId === 'string' && UUID_RE.test(body.sessionId)) {
      sessionId = body.sessionId;
    }
  } catch {
    /* sin body o JSON inválido: el checkout sigue sin enlace */
  }

  try {
    // Precio base en EUR
    const row = await queryOne<{ discount_price: string | number | null }>(
      `SELECT discount_price FROM "homeContent" WHERE id = 'default'`
    );
    const eurPrice = Number(row?.discount_price ?? 10);

    // Moneda local del visitante (Colombia no llega aquí: va por Mercado Pago)
    const geo = await getGeoFromRequest(req);
    const supported = await stripeSupportedCurrencies();
    let currency = (geo.currency || 'EUR').toUpperCase();
    if (!supported.has(currency)) currency = supported.has('USD') ? 'USD' : 'EUR';

    // Conversión EUR → moneda local (si falla, EUR)
    let finalCurrency = currency;
    let amountMajor = eurPrice;
    if (currency !== 'EUR') {
      const conv = await convertEur(eurPrice, currency);
      if (conv) {
        amountMajor = conv.amount;
      } else {
        finalCurrency = 'EUR';
        amountMajor = eurPrice;
      }
    }

    const amount = toStripeAmount(amountMajor, finalCurrency);

    const intent = await getStripe().paymentIntents.create({
      amount,
      currency: finalCurrency.toLowerCase(),
      automatic_payment_methods: { enabled: true },
      metadata: {
        productName: PRODUCT_CONFIG.name,
        presentment_currency: finalCurrency,
        ...(sessionId ? { session_uuid: sessionId } : {}),
      },
    });

    // Analítica: la visita ha iniciado checkout (aún no completado).
    await markCheckoutStarted(sessionId);

    return NextResponse.json({ clientSecret: intent.client_secret });
  } catch (error) {
    console.error('[stripe] error creando PaymentIntent:', error);
    return NextResponse.json({ error: 'checkout_error' }, { status: 500 });
  }
}
