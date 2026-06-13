import { NextResponse } from 'next/server';
import { getStripe, isStripeConfigured } from '@/lib/payments/stripe';
import { PRODUCT_CONFIG } from '@/lib/product';
import { queryOne } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ============================================================
// Stripe Payment Element — crea un PaymentIntent y devuelve su client_secret.
// El front (StripeEmbedded.tsx) renderiza SOLO el formulario de pago (sin
// resumen de producto, sin dirección, con el email integrado) y confirma con
// stripe.confirmPayment. La entrega la dispara el webhook (payment_intent.succeeded)
// vía finalizeSale(); aquí no entregamos nada.
//
// Precio en EUR desde "homeContent".discount_price (única fuente de verdad).
// ============================================================
export async function POST() {
  if (!isStripeConfigured()) {
    console.error('[stripe] STRIPE_SECRET_KEY no configurada');
    return NextResponse.json({ error: 'not_configured' }, { status: 500 });
  }

  try {
    const row = await queryOne<{ discount_price: string | number | null }>(
      `SELECT discount_price FROM "homeContent" WHERE id = 'default'`
    );
    const price = Number(row?.discount_price ?? 10);
    const amount = Math.round(price * 100); // céntimos

    const intent = await getStripe().paymentIntents.create({
      amount,
      currency: PRODUCT_CONFIG.currency, // 'eur'
      automatic_payment_methods: { enabled: true },
      metadata: { productName: PRODUCT_CONFIG.name },
    });

    return NextResponse.json({ clientSecret: intent.client_secret });
  } catch (error) {
    console.error('[stripe] error creando PaymentIntent:', error);
    return NextResponse.json({ error: 'checkout_error' }, { status: 500 });
  }
}
