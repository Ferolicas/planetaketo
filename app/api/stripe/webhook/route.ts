import { NextRequest, NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { getStripe, isStripeConfigured } from '@/lib/payments/stripe';
import { PRODUCT_CONFIG } from '@/lib/product';
import { finalizeSale } from '@/lib/payments/process-sale';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ============================================================
// Webhook de Stripe — disparador de la entrega para el cobro mundial.
// Tras pago confirmado, entregamos el libro (Resend + magic link) vía
// finalizeSale(). finalizeSale es idempotente por id externo del pago, así que
// los reintentos de Stripe (y el solapamiento con la confirmación del front)
// son seguros.
//
// Requiere el cuerpo CRUDO para validar la firma (por eso req.text()).
// ============================================================
export async function POST(req: NextRequest) {
  if (!isStripeConfigured() || !process.env.STRIPE_WEBHOOK_SECRET) {
    console.error('[stripe] webhook no configurado (falta secret key o webhook secret)');
    return NextResponse.json({ error: 'not_configured' }, { status: 500 });
  }

  const body = await req.text();
  const signature = req.headers.get('stripe-signature');
  if (!signature) {
    return NextResponse.json({ error: 'no_signature' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET);
    console.log(`[stripe] webhook: ${event.type} | id=${event.id}`);
  } catch (err) {
    console.error('[stripe] firma de webhook inválida:', (err as Error).message);
    return NextResponse.json({ error: 'invalid_signature' }, { status: 400 });
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
    // 500 => Stripe reintenta.
    const e = err as Record<string, unknown>;
    console.error('[stripe] error procesando webhook:', {
      message: e?.message,
      code: e?.code,
      detail: e?.detail,
      constraint: e?.constraint,
    });
    return NextResponse.json({ error: 'processing_error' }, { status: 500 });
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

  // Solo entregamos si el pago está realmente cobrado.
  if (session.payment_status && session.payment_status !== 'paid') {
    return NextResponse.json({ received: true, ignored: 'unpaid' });
  }

  let email = session.customer_email || session.customer_details?.email || '';
  let name = session.customer_details?.name || 'Cliente';
  const country = session.customer_details?.address?.country || null;

  if (session.customer) {
    try {
      const customer = await getStripe().customers.retrieve(session.customer as string);
      if (typeof customer !== 'string' && !customer.deleted) {
        email = customer.email || email;
        name = customer.name || name;
      }
    } catch (err) {
      console.warn('[stripe] no se pudo recuperar el customer:', (err as Error).message);
    }
  }

  const result = await finalizeSale({
    provider: 'stripe',
    externalId: String(session.payment_intent), // clave de idempotencia
    externalRef: session.id,
    email,
    name,
    country,
    amount: (session.amount_total || 0) / 100,
    currency: session.currency || 'eur',
    status: session.payment_status || 'paid',
    productName: PRODUCT_CONFIG.name,
    externalCustomerId: typeof session.customer === 'string' ? session.customer : null,
    sessionId: (session.metadata?.session_uuid as string) || null,
  });

  return NextResponse.json(resultPayload(result));
}

async function handlePaymentIntent(event: Stripe.Event): Promise<NextResponse> {
  const pi = event.data.object as Stripe.PaymentIntent;

  // En Embedded Checkout la venta se cierra en checkout.session.completed.
  // Solo procesamos aquí si llega email por metadata (caminos alternativos).
  const email = (pi.metadata?.customerEmail as string) || pi.receipt_email || '';
  if (!email) {
    return NextResponse.json({ received: true, status: 'deferred_to_session' });
  }

  const result = await finalizeSale({
    provider: 'stripe',
    externalId: pi.id,
    externalRef: null,
    email,
    name: (pi.metadata?.customerName as string) || 'Cliente',
    country: null,
    amount: pi.amount / 100,
    currency: pi.currency,
    status: 'paid',
    productName: (pi.metadata?.productName as string) || PRODUCT_CONFIG.name,
    externalCustomerId: typeof pi.customer === 'string' ? pi.customer : null,
    sessionId: (pi.metadata?.session_uuid as string) || null,
  });

  return NextResponse.json(resultPayload(result));
}
