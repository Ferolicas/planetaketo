import { NextRequest, NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { stripe, PRODUCT_CONFIG } from '@/lib/stripe/config';
import { finalizeSale } from '@/lib/payments/process-sale';

export const runtime = 'nodejs';

// Webhook de Stripe. El email/entrega solo se procesan tras pago confirmado.
// finalizeSale() es idempotente, así que reintentos de Stripe son seguros.
export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
    console.log(`📨 Webhook: ${event.type} | ID: ${event.id}`);
  } catch (err) {
    console.error('❌ Firma de webhook inválida:', (err as Error).message);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    if (event.type === 'checkout.session.completed') {
      return await handleCheckoutSession(event);
    }
    if (event.type === 'payment_intent.succeeded') {
      return await handlePaymentIntent(event);
    }
    return NextResponse.json({ received: true });
  } catch (err) {
    // 500 => Stripe reintenta
    console.error('❌ Error procesando webhook:', (err as Error).message);
    return NextResponse.json({ error: 'Error processing payment' }, { status: 500 });
  }
}

function resultPayload(result: Awaited<ReturnType<typeof finalizeSale>>) {
  return {
    received: true,
    status: result.status,
    paymentId: 'paymentId' in result ? result.paymentId : undefined,
  };
}

async function handleCheckoutSession(event: Stripe.Event): Promise<NextResponse> {
  const session = event.data.object as Stripe.Checkout.Session;

  let email = session.customer_email || session.customer_details?.email || '';
  let name = session.customer_details?.name || 'Cliente';
  const country = session.customer_details?.address?.country || null;

  if (session.customer) {
    try {
      const customer = await stripe.customers.retrieve(session.customer as string);
      if (typeof customer !== 'string' && !customer.deleted) {
        email = customer.email || email;
        name = customer.name || name;
      }
    } catch (err) {
      console.warn('⚠️  No se pudo recuperar el customer de Stripe:', (err as Error).message);
    }
  }

  const result = await finalizeSale({
    stripePaymentId: session.payment_intent as string,
    stripeSessionId: session.id,
    email,
    name,
    country,
    amount: (session.amount_total || 0) / 100,
    currency: session.currency || 'eur',
    status: session.payment_status || 'paid',
    productName: PRODUCT_CONFIG.name,
    stripeCustomerId: typeof session.customer === 'string' ? session.customer : null,
  });

  return NextResponse.json(resultPayload(result));
}

async function handlePaymentIntent(event: Stripe.Event): Promise<NextResponse> {
  const pi = event.data.object as Stripe.PaymentIntent;

  // Si el frontend no puso el email en metadata, lo procesa /complete-purchase.
  if (!pi.metadata.customerEmail) {
    return NextResponse.json({ received: true, status: 'deferred_to_frontend' });
  }

  const result = await finalizeSale({
    stripePaymentId: pi.id,
    stripeSessionId: null,
    email: pi.metadata.customerEmail || pi.receipt_email || '',
    name: pi.metadata.customerName || 'Cliente',
    country: null,
    amount: pi.amount / 100,
    currency: pi.currency,
    status: 'paid',
    productName: pi.metadata.productName || PRODUCT_CONFIG.name,
    stripeCustomerId: typeof pi.customer === 'string' ? pi.customer : null,
  });

  return NextResponse.json(resultPayload(result));
}
