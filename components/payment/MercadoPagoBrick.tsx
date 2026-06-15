'use client';

import { useEffect, useState } from 'react';
import { initMercadoPago, Payment } from '@mercadopago/sdk-react';

// ============================================================
// Payment Brick de Mercado Pago dentro del modal (cobro Colombia, COP).
// El brick tokeniza en el cliente y, en onSubmit, mandamos el formData a
// /api/checkout/mercadopago/pay (que recalcula el importe COP server-side).
// La entrega del libro la confirma el webhook; aquí solo reflejamos el estado.
//
// Métodos: tarjeta (100% embebido). PSE/Efecty devuelven una URL del banco a la
// que redirigimos (no se pueden completar dentro del iframe, por diseño de MP).
// ============================================================

let mpInitialized = false;
function ensureMpInit(): boolean {
  const key = process.env.NEXT_PUBLIC_MP_PUBLIC_KEY;
  if (!key) return false;
  if (!mpInitialized) {
    initMercadoPago(key, { locale: 'es-CO' });
    mpInitialized = true;
  }
  return true;
}

interface Props {
  amountCop: number;
  onSuccess: () => void;
  onPending: (msg: string) => void;
  onFailure: (msg: string) => void;
}

export default function MercadoPagoBrick({ amountCop, onSuccess, onPending, onFailure }: Props) {
  const [available, setAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    setAvailable(ensureMpInit());
  }, []);

  if (available === false) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center px-8">
        <p className="text-red-600 font-semibold">El pago no está disponible ahora.</p>
        <p className="text-sm text-gray-500 mt-2">Vuelve a intentarlo más tarde o contáctanos.</p>
      </div>
    );
  }

  if (available === null) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-forest border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-4">
      <Payment
        initialization={{ amount: amountCop }}
        customization={{
          paymentMethods: {
            creditCard: 'all',
            debitCard: 'all',
            ticket: 'all',
            bankTransfer: 'all',
          },
        }}
        onSubmit={async ({ formData }) => {
          const res = await fetch('/api/checkout/mercadopago/pay', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData),
          });
          const data = await res.json();

          if (data?.status === 'approved') {
            onSuccess();
          } else if (data?.redirect_url) {
            // PSE/Efecty: completar el pago en el banco/punto.
            window.location.href = data.redirect_url as string;
          } else if (data?.status === 'in_process' || data?.status === 'pending') {
            onPending(String(data?.status_detail ?? 'pending'));
          } else {
            onFailure(String(data?.status_detail ?? data?.error ?? 'rejected'));
          }
        }}
        onError={(error) => onFailure(String((error as { message?: string })?.message ?? 'brick_error'))}
      />
    </div>
  );
}
