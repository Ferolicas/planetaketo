'use client';

import { useState } from 'react';
import PaymentModal from '@/components/payment/PaymentModal';

interface CheckoutButtonProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Botón de compra. Abre el modal de pago de Planeta Keto, que detecta la región
 * y embebe el checkout adecuado (Stripe para el mundo, Mercado Pago para
 * Colombia) sin salir del sitio.
 */
export default function CheckoutButton({ children, className }: CheckoutButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleClick = () => {
    // Registra el clic a comprar (analítica del embudo). No bloquea la apertura.
    fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'checkout_click',
        path: typeof window !== 'undefined' ? window.location.pathname : null,
      }),
      keepalive: true,
    }).catch(() => {});
    setIsModalOpen(true);
  };

  return (
    <>
      <button onClick={handleClick} className={className}>
        {children}
      </button>

      <PaymentModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
}
