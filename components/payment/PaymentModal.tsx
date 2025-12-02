'use client';

import { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  ExpressCheckoutElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import { X } from 'lucide-react';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  currency?: string;
  productName?: string;
}

function CheckoutForm({ amount, currency, onSuccess, onClose }: {
  amount: number;
  currency: string;
  onSuccess: () => void;
  onClose: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [expressCheckoutReady, setExpressCheckoutReady] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/success`,
        },
        redirect: 'if_required',
      });

      if (error) {
        setErrorMessage(error.message || 'Error al procesar el pago');
        console.error('Payment error:', error);
      } else {
        // Payment succeeded
        console.log('✅ Payment successful');
        onSuccess();
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error inesperado');
      console.error('Payment exception:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Express Checkout (Apple Pay, Google Pay, etc) */}
      <div className="mb-6">
        <ExpressCheckoutElement
          onConfirm={async (event) => {
            // Express checkout is handled by Stripe automatically
            console.log('Express checkout confirmed:', event);
          }}
          onReady={() => setExpressCheckoutReady(true)}
          options={{
            buttonType: {
              applePay: 'buy',
              googlePay: 'buy',
            },
          }}
        />
        {expressCheckoutReady && (
          <div className="mt-3 text-center text-sm text-gray-500">
            o paga con tarjeta
          </div>
        )}
      </div>

      {/* Payment Element (Card, SEPA, etc) */}
      <PaymentElement
        options={{
          layout: 'tabs',
          fields: {
            billingDetails: {
              email: 'auto',
              name: 'never',
              address: 'never',
              phone: 'never',
            },
          },
        }}
      />

      {/* Error Message */}
      {errorMessage && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {errorMessage}
        </div>
      )}

      {/* Submit Button */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onClose}
          disabled={isProcessing}
          className="flex-1 px-6 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={!stripe || isProcessing}
          className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {isProcessing ? (
            <span className="flex items-center justify-center gap-2">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Procesando...
            </span>
          ) : (
            `Pagar ${amount.toFixed(2)} ${currency.toUpperCase()}`
          )}
        </button>
      </div>

      <p className="text-xs text-gray-500 text-center">
        Tu pago es seguro y encriptado. <br />
        Procesado por Stripe.
      </p>
    </form>
  );
}

export default function PaymentModal({
  isOpen,
  onClose,
  amount,
  currency = 'eur',
  productName = 'Método Keto 70 Días',
}: PaymentModalProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [detectedCurrency, setDetectedCurrency] = useState(currency);
  const [detectedAmount, setDetectedAmount] = useState(amount);

  // Detect user's currency and create payment intent immediately
  useEffect(() => {
    if (isOpen && !clientSecret) {
      detectUserCurrencyAndCreatePayment();
    }
  }, [isOpen]);

  const detectUserCurrencyAndCreatePayment = async () => {
    setIsLoading(true);

    try {
      // Detect currency
      let finalCurrency = currency;
      let finalAmount = amount;

      try {
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();

        const currencyMap: Record<string, { currency: string; rate: number }> = {
          'US': { currency: 'usd', rate: 1.1 },
          'GB': { currency: 'gbp', rate: 0.85 },
          'MX': { currency: 'mxn', rate: 22 },
          'CO': { currency: 'cop', rate: 4500 },
          'AR': { currency: 'ars', rate: 350 },
          'CL': { currency: 'clp', rate: 950 },
          'PE': { currency: 'pen', rate: 4 },
        };

        const countryCode = data.country_code;
        if (currencyMap[countryCode]) {
          const { currency: newCurrency, rate } = currencyMap[countryCode];
          finalCurrency = newCurrency;
          finalAmount = amount * rate;
          console.log(`✓ Detected: ${newCurrency} (${countryCode})`);
        }
      } catch (error) {
        console.log('Using default currency:', currency);
      }

      setDetectedCurrency(finalCurrency);
      setDetectedAmount(finalAmount);

      // Create Payment Intent immediately
      const response = await fetch('/api/stripe/payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: finalAmount,
          currency: finalCurrency,
        }),
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      setClientSecret(data.clientSecret);
      console.log('✓ Payment ready');
    } catch (error: any) {
      console.error('Failed to create payment:', error);
      alert(`Error: ${error.message}`);
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuccess = () => {
    alert('✅ ¡Pago exitoso! Revisa tu email para acceder al producto.');
    onClose();
  };

  if (!isOpen) return null;

  const options = clientSecret
    ? {
        clientSecret,
        appearance: {
          theme: 'stripe' as const,
          variables: {
            colorPrimary: '#22c55e',
            colorBackground: '#ffffff',
            colorText: '#1f2937',
            colorDanger: '#ef4444',
            borderRadius: '8px',
          },
        },
      }
    : undefined;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{productName}</h2>
              <p className="text-3xl font-bold text-green-600 mt-2">
                {detectedAmount.toFixed(2)} {detectedCurrency.toUpperCase()}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {clientSecret && options ? (
            // Payment Form - DIRECTO
            <Elements stripe={stripePromise} options={options}>
              <CheckoutForm
                amount={detectedAmount}
                currency={detectedCurrency}
                onSuccess={handleSuccess}
                onClose={onClose}
              />
            </Elements>
          ) : (
            // Loading
            <div className="text-center py-12">
              <div className="w-16 h-16 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="mt-4 text-gray-600 font-medium">Preparando pago...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
