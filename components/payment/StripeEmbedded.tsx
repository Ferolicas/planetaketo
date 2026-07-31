'use client';

import { useEffect, useState } from 'react';
import { loadStripe, type Appearance } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  LinkAuthenticationElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { getSid } from '@/lib/analytics/consent';

// ============================================================
// Stripe Payment Element dentro del modal (cobro mundial, EUR).
// Muestra SOLO el formulario de pago: email + método de pago (sin resumen de
// producto, sin dirección). Ocupa todo el modal. Al confirmar, la entrega la
// hace el webhook (payment_intent.succeeded) vía finalizeSale().
// ============================================================

const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const stripePromise = publishableKey ? loadStripe(publishableKey) : null;

const appearance: Appearance = {
  theme: 'stripe',
  variables: {
    colorPrimary: '#059669',
    borderRadius: '10px',
    fontFamily: 'system-ui, sans-serif',
  },
};

interface Props {
  amountLabel: string;
  productSlug?: string | null;
  onSuccess: () => void;
  onPending: (msg: string) => void;
  onFailure: (msg: string) => void;
}

export default function StripeEmbedded({
  amountLabel,
  productSlug = null,
  onSuccess,
  onPending,
  onFailure,
}: Props) {
  const [clientSecret, setClientSecret] = useState('');
  const [unavailable, setUnavailable] = useState(false);
  const [checkoutAttemptId] = useState(() => crypto.randomUUID());

  useEffect(() => {
    if (!stripePromise) {
      setUnavailable(true);
      return;
    }
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 20_000);
    let alive = true;

    const preparePayment = async () => {
      try {
        const response = await fetch('/api/checkout/stripe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: getSid(),
            productSlug,
            checkoutAttemptId,
          }),
          signal: controller.signal,
        });
        const data = await response.json().catch(() => null);
        if (!response.ok || !data?.clientSecret) throw new Error('stripe_prepare_failed');
        if (alive) setClientSecret(data.clientSecret);
      } catch {
        if (alive) setUnavailable(true);
      } finally {
        window.clearTimeout(timeout);
      }
    };

    void preparePayment();
    return () => {
      alive = false;
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [checkoutAttemptId, productSlug]);

  if (unavailable) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center px-8">
        <p className="text-red-600 font-semibold">El pago con tarjeta no está disponible ahora.</p>
        <p className="text-sm text-gray-500 mt-2">Vuelve a intentarlo más tarde o contáctanos.</p>
      </div>
    );
  }

  if (!clientSecret) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-forest border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <Elements stripe={stripePromise} options={{ clientSecret, appearance }}>
      <CheckoutForm
        amountLabel={amountLabel}
        onSuccess={onSuccess}
        onPending={onPending}
        onFailure={onFailure}
      />
    </Elements>
  );
}

function CheckoutForm({ amountLabel, onSuccess, onPending, onFailure }: Props) {
  const stripe = useStripe();
  const elements = useElements();
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    if (!email) {
      setError('Introduce tu correo para enviarte el libro.');
      return;
    }
    setSubmitting(true);
    setError('');

    try {
      const { error: stripeError, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/gracias`,
          receipt_email: email,
        },
        redirect: 'if_required',
      });

      if (stripeError) {
        const msg = stripeError.message || 'No se pudo completar el pago.';
        setError(msg);
        if (!['validation_error', 'card_error'].includes(stripeError.type)) {
          onFailure(msg);
        }
        return;
      }

      if (paymentIntent?.status === 'succeeded') {
        onSuccess();
      } else if (
        !paymentIntent ||
        paymentIntent.status === 'processing' ||
        paymentIntent.status === 'requires_action'
      ) {
        onPending('Tu banco está confirmando el pago.');
      } else {
        const msg = 'El pago no se confirmó. Revisa los datos o prueba con otra tarjeta.';
        setError(msg);
        onFailure(msg);
      }
    } catch (caught) {
      const isIntegrationError =
        (caught as { name?: string })?.name === 'IntegrationError';
      const msg = isIntegrationError
        ? 'El formulario de pago no pudo validarse. Inténtalo de nuevo.'
        : 'No pudimos confirmar la respuesta del banco. Revisa tu correo o movimientos antes de volver a pagar.';
      setError(msg);
      if (isIntegrationError) onFailure(msg);
      else onPending(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-2 space-y-3">
        <LinkAuthenticationElement onChange={(e) => setEmail(e.value.email)} />
        <PaymentElement
          options={{
            layout: 'accordion',
          }}
        />
        {error && <p className="text-red-600 text-sm">{error}</p>}
      </div>
      <div className="p-4 border-t border-gray-100">
        <button
          type="submit"
          disabled={!stripe || submitting}
          className="w-full py-3.5 bg-cta text-forest-dark rounded-full font-bold hover:bg-cta-dark hover:text-white transition disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
        >
          {submitting ? 'Procesando…' : `Pagar ${amountLabel}`}
        </button>
      </div>
    </form>
  );
}
