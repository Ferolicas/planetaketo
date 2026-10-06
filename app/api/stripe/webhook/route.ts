import { NextRequest, NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { getStripe, isStripeConfigured } from '@/lib/payments/stripe';
import { finalizeSale } from '@/lib/payments/process-sale';
import catalog from '@/data/catalog.json';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// ============================================================
// Webhook de Stripe — disparador de la entrega para cobros en Europa.
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

function verifiedProduct(slug: string | null | undefined): { slug: string; title: string } {
  const resolved = slug || 'metodo-keto';
  const all = [
    ...(catalog.products as { slug: string; title: string }[]),
    ...(catalog.bundles as { slug: string; title: string }[]),
  ];
  const item = all.find((entry) => entry.slug === resolved);
  if (!item) throw new Error(`Producto Stripe desconocido: ${resolved}`);
  return item;
}

function hasPlanetaCheckoutMarker(metadata: Stripe.Metadata | null): boolean {
  if (!metadata) return false;
  return (
    metadata.integration === 'planetaketo' &&
    typeof metadata.checkout_attempt === 'string' &&
    UUID_RE.test(metadata.checkout_attempt)
  );
}

function verifiedPaymentIntentProduct(pi: Stripe.PaymentIntent): { slug: string; title: string } {
  if (!hasPlanetaCheckoutMarker(pi.metadata)) {
    throw new Error('PaymentIntent ajeno a Planeta Keto');
  }
  if (!pi.livemode) throw new Error('PaymentIntent no LIVE; entrega bloqueada');

  const expectedAmount = Number(pi.metadata.expected_amount_minor);
  const expectedCurrency = pi.metadata.expected_currency?.toLowerCase();
  if (!Number.isSafeInteger(expectedAmount) || expectedAmount <= 0 || pi.amount !== expectedAmount) {
    throw new Error('Importe Stripe no coincide con el creado por el servidor');
  }
  if (!expectedCurrency || pi.currency.toLowerCase() !== expectedCurrency) {
    throw new Error('Moneda Stripe no coincide con la creada por el servidor');
  }
  return verifiedProduct(pi.metadata.product_slug);
}

async function handleCheckoutSession(event: Stripe.Event): Promise<NextResponse> {
  const session = event.data.object as Stripe.Checkout.Session;

  // La tienda actual usa Payment Intents. Solo conservamos compatibilidad con
  // Checkout Sessions que lleven la misma marca server-side del proyecto.
  if (!hasPlanetaCheckoutMarker(session.metadata)) {
    return NextResponse.json({ received: true, ignored: 'foreign_checkout_session' });
  }

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

  if (!session.payment_intent) {
    return NextResponse.json({ received: true, ignored: 'missing_payment_intent' });
  }
  const product = verifiedProduct(session.metadata?.product_slug);

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
    productName: product.title,
    externalCustomerId: typeof session.customer === 'string' ? session.customer : null,
    sessionId: (session.metadata?.session_uuid as string) || null,
    productSlug: product.slug,
  });

  return NextResponse.json(resultPayload(result));
}

async function handlePaymentIntent(event: Stripe.Event): Promise<NextResponse> {
  const pi = event.data.object as Stripe.PaymentIntent;

  if (!hasPlanetaCheckoutMarker(pi.metadata)) {
    return NextResponse.json({ received: true, ignored: 'foreign_payment_intent' });
  }

  // El Payment Element de la tienda genera payment_intent.succeeded.
  let email = (pi.metadata?.customerEmail as string) || pi.receipt_email || '';
  let name = (pi.metadata?.customerName as string) || 'Cliente';
  let country: string | null = null;
  if (pi.payment_method && (!email || name === 'Cliente')) {
    try {
      const paymentMethod = await getStripe().paymentMethods.retrieve(
        typeof pi.payment_method === 'string' ? pi.payment_method : pi.payment_method.id
      );
      email = paymentMethod.billing_details.email || email;
      name = paymentMethod.billing_details.name || name;
      country = paymentMethod.billing_details.address?.country || null;
    } catch (error) {
      console.warn('[stripe] no se pudo recuperar el método de pago:', (error as Error).message);
    }
  }
  if (!email) {
    throw new Error('Stripe confirmó el pago pero no devolvió email del comprador');
  }
  const product = verifiedPaymentIntentProduct(pi);

  const result = await finalizeSale({
    provider: 'stripe',
    externalId: pi.id,
    externalRef: null,
    email,
    name,
    country,
    amount: (pi.amount_received || pi.amount) / 100,
    currency: pi.currency,
    status: 'paid',
    productName: product.title,
    externalCustomerId: typeof pi.customer === 'string' ? pi.customer : null,
    sessionId: (pi.metadata?.session_uuid as string) || null,
    productSlug: product.slug,
  });

  return NextResponse.json(resultPayload(result));
}
