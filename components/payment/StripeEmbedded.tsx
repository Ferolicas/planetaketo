'use client';

import { useCallback } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from '@stripe/react-stripe-js';

// ============================================================
// Stripe Embedded Checkout dentro del modal (cobro mundial, EUR).
// Pide el client_secret a /api/checkout/stripe. Al completarse el pago,
// `onComplete` avisa al modal padre (la entrega real la hace el webhook).
// ============================================================

const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const stripePromise = publishableKey ? loadStripe(publishableKey) : null;

export default function StripeEmbedded({ onComplete }: { onComplete: () => void }) {
  const fetchClientSecret = useCallback(async () => {
    const res = await fetch('/api/checkout/stripe', { method: 'POST' });
    const data = await res.json();
    if (!data?.clientSecret) throw new Error('stripe_no_client_secret');
    return data.clientSecret as string;
  }, []);

  if (!stripePromise) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center px-8">
        <p className="text-red-600 font-semibold">El pago con tarjeta no está disponible ahora.</p>
        <p className="text-sm text-gray-500 mt-2">Vuelve a intentarlo más tarde o contáctanos.</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <EmbeddedCheckoutProvider stripe={stripePromise} options={{ fetchClientSecret, onComplete }}>
        <EmbeddedCheckout />
      </EmbeddedCheckoutProvider>
    </div>
  );
}
