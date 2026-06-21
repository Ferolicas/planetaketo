'use client';

import { useState } from 'react';
import PaymentModal from '@/components/payment/PaymentModal';

interface CheckoutButtonProps {
  children: React.ReactNode;
  className?: string;
  /** Clave del botón para la analítica propia (data-cta). El clic lo registra el
   *  tracker mediante un listener delegado, SOLO si hay consentimiento. */
  cta?: string;
}

/**
 * Botón de compra. Abre el modal de pago de Planeta Keto, que detecta la región
 * y embebe el checkout adecuado (Stripe para el mundo, Mercado Pago para
 * Colombia) sin salir del sitio.
 */
export default function CheckoutButton({ children, className, cta }: CheckoutButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <button data-cta={cta} onClick={() => setIsModalOpen(true)} className={className}>
        {children}
      </button>

      <PaymentModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
}
