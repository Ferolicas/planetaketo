import { NextRequest, NextResponse } from 'next/server';
import { getStripe, isStripeConfigured } from '@/lib/payments/stripe';
import { PRODUCT_CONFIG } from '@/lib/product';
import { queryOne } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ============================================================
// Stripe Embedded Checkout — crea la sesión y devuelve el client_secret para
// renderizar el checkout DENTRO del modal (sin redirección).
//
// Precio en EUR desde "homeContent".discount_price (única fuente de verdad,
// mismo patrón que /api/settings). La entrega la dispara el webhook de Stripe
// vía finalizeSale(); aquí no entregamos nada.
// ============================================================
export async function POST(req: NextRequest) {
  if (!isStripeConfigured()) {
    console.error('[stripe] STRIPE_SECRET_KEY no configurada');
    return NextResponse.json({ error: 'not_configured' }, { status: 500 });
  }

  try {
    const row = await queryOne<{ discount_price: string | number | null }>(
      `SELECT discount_price FROM "homeContent" WHERE id = 'default'`
    );
    const price = Number(row?.discount_price ?? 10);
    const unitAmount = Math.round(price * 100); // céntimos

    const session = await getStripe().checkout.sessions.create({
      // Stripe SDK v22: el valor del ui_mode embebido es 'embedded_page'.
      ui_mode: 'embedded_page',
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: PRODUCT_CONFIG.currency, // 'eur'
            unit_amount: unitAmount,
            product_data: {
              name: PRODUCT_CONFIG.name,
              description: PRODUCT_CONFIG.description,
            },
          },
          quantity: 1,
        },
      ],
      billing_address_collection: 'required',
      // Sin redirección: el modal muestra el estado de éxito con onComplete.
      redirect_on_completion: 'never',
      metadata: {
        productName: PRODUCT_CONFIG.name,
        pdfFileName: PRODUCT_CONFIG.pdfFileName,
      },
      payment_intent_data: {
        metadata: { productName: PRODUCT_CONFIG.name },
      },
    });

    return NextResponse.json({ clientSecret: session.client_secret, sessionId: session.id });
  } catch (error) {
    console.error('[stripe] error creando checkout:', error);
    return NextResponse.json({ error: 'checkout_error' }, { status: 500 });
  }
}

// Estado de la sesión, para que el modal confirme el pago antes de dar éxito.
export async function GET(req: NextRequest) {
  if (!isStripeConfigured()) {
    return NextResponse.json({ error: 'not_configured' }, { status: 500 });
  }
  const sessionId = req.nextUrl.searchParams.get('session_id');
  if (!sessionId) {
    return NextResponse.json({ error: 'missing_session_id' }, { status: 400 });
  }
  try {
    const session = await getStripe().checkout.sessions.retrieve(sessionId);
    return NextResponse.json({
      status: session.status, // 'open' | 'complete' | 'expired'
      paymentStatus: session.payment_status, // 'paid' | 'unpaid' | 'no_payment_required'
    });
  } catch (error) {
    console.error('[stripe] error recuperando sesión:', error);
    return NextResponse.json({ error: 'retrieve_error' }, { status: 500 });
  }
}
