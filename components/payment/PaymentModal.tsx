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
import { X, CheckCircle } from 'lucide-react';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  currency?: string;
  productName?: string;
}

interface CustomerData {
  name: string;
  email: string;
}

function CheckoutForm({ amount, currency, onPaymentSuccess, onClose }: {
  amount: number;
  currency: string;
  onPaymentSuccess: (paymentIntentId: string) => void;
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
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/success`,
        },
        redirect: 'if_required',
      });

      if (error) {
        setErrorMessage(error.message || 'Error al procesar el pago');
        console.error('Payment error:', error);
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        console.log('✅ Payment successful:', paymentIntent.id);
        onPaymentSuccess(paymentIntent.id);
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
  const [step, setStep] = useState<'payment' | 'customer-form' | 'success'>('payment');
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  const [customerData, setCustomerData] = useState<CustomerData>({ name: '', email: '' });
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [detectedCurrency, setDetectedCurrency] = useState(currency);
  const [detectedAmount, setDetectedAmount] = useState(amount);
  const [formErrors, setFormErrors] = useState<{ name?: string; email?: string }>({});

  // Detect currency and create payment intent when modal opens
  useEffect(() => {
    if (isOpen && !clientSecret) {
      detectCurrencyAndCreatePayment();
    }
  }, [isOpen]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setStep('payment');
      setPaymentIntentId(null);
      setCustomerData({ name: '', email: '' });
      setClientSecret(null);
      setFormErrors({});
    }
  }, [isOpen]);

  const detectCurrencyAndCreatePayment = async () => {
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

      // Create Payment Intent (sin datos de cliente aún)
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

  const handlePaymentSuccess = (intentId: string) => {
    console.log('Payment successful, asking for customer data');
    setPaymentIntentId(intentId);
    setStep('customer-form');
  };

  const validateForm = () => {
    const errors: { name?: string; email?: string } = {};

    if (!customerData.name.trim() || customerData.name.trim().length < 2) {
      errors.name = 'Por favor ingresa tu nombre';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!customerData.email.trim() || !emailRegex.test(customerData.email)) {
      errors.email = 'Por favor ingresa un email válido';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmitCustomerData = async () => {
    if (!validateForm() || !paymentIntentId) return;

    setIsSendingEmail(true);

    try {
      // Enviar datos del cliente al servidor para completar el proceso
      const response = await fetch('/api/stripe/complete-purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentIntentId,
          customerName: customerData.name,
          customerEmail: customerData.email,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al completar la compra');
      }

      console.log('✅ Purchase completed, email sent');
      setStep('success');
    } catch (error: any) {
      console.error('Error completing purchase:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setIsSendingEmail(false);
    }
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
              {step === 'payment' && (
                <p className="text-3xl font-bold text-green-600 mt-2">
                  {detectedAmount.toFixed(2)} {detectedCurrency.toUpperCase()}
                </p>
              )}
              {step === 'customer-form' && (
                <p className="text-green-600 mt-2 flex items-center gap-2">
                  <CheckCircle size={20} />
                  Pago completado
                </p>
              )}
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
          {/* Step 1: Payment Form */}
          {step === 'payment' && (
            <>
              {clientSecret && options ? (
                <Elements stripe={stripePromise} options={options}>
                  <CheckoutForm
                    amount={detectedAmount}
                    currency={detectedCurrency}
                    onPaymentSuccess={handlePaymentSuccess}
                    onClose={onClose}
                  />
                </Elements>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <p className="mt-4 text-gray-600 font-medium">Preparando pago...</p>
                </div>
              )}
            </>
          )}

          {/* Step 2: Customer Data Form (after payment) */}
          {step === 'customer-form' && (
            <div className="space-y-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-2" />
                <p className="text-green-800 font-semibold">¡Pago exitoso!</p>
                <p className="text-green-700 text-sm mt-1">
                  Ingresa tus datos para recibir el producto
                </p>
              </div>

              {/* Name Field */}
              <div>
                <label htmlFor="payment-name" className="block text-sm font-medium text-gray-700 mb-2">
                  Tu nombre
                </label>
                <input
                  id="payment-name"
                  type="text"
                  value={customerData.name}
                  onChange={(e) => setCustomerData({ ...customerData, name: e.target.value })}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 ${
                    formErrors.name ? 'border-red-500 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="Ej: María García"
                  autoFocus
                />
                {formErrors.name && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.name}</p>
                )}
              </div>

              {/* Email Field */}
              <div>
                <label htmlFor="payment-email" className="block text-sm font-medium text-gray-700 mb-2">
                  Tu email
                </label>
                <input
                  id="payment-email"
                  type="email"
                  value={customerData.email}
                  onChange={(e) => setCustomerData({ ...customerData, email: e.target.value })}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 ${
                    formErrors.email ? 'border-red-500 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="tu@email.com"
                />
                {formErrors.email && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.email}</p>
                )}
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>📧 Importante:</strong> A este email recibirás el enlace de descarga del producto.
                </p>
              </div>

              {/* Submit Button */}
              <button
                type="button"
                onClick={handleSubmitCustomerData}
                disabled={isSendingEmail}
                className="w-full px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {isSendingEmail ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Enviando...
                  </span>
                ) : (
                  'Recibir mi producto'
                )}
              </button>
            </div>
          )}

          {/* Step 3: Success */}
          {step === 'success' && (
            <div className="text-center py-8">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-12 h-12 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">¡Listo!</h3>
              <p className="text-gray-600 mb-6">
                Hemos enviado el enlace de descarga a<br />
                <strong className="text-gray-900">{customerData.email}</strong>
              </p>
              <p className="text-sm text-gray-500 mb-6">
                Revisa tu bandeja de entrada (y spam) en los próximos minutos.
              </p>
              <button
                onClick={onClose}
                className="px-8 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition"
              >
                Cerrar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
