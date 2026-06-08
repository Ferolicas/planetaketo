'use client';

import { useState } from 'react';
import PaymentModal from '@/components/payment/PaymentModal';

interface CheckoutButtonProps {
  children: React.ReactNode;
  className?: string;
  amount?: number;
  currency?: string;
  productName?: string;
}

/**
 * Botón de compra. Abre el modal de pago de Planeta Keto, que embebe el
 * checkout de Hotmart (sin redirección, sin salir del sitio).
 */
export default function CheckoutButton({
  children,
  className,
  amount = 10,
  currency = 'eur',
  productName = 'Método Keto 70 Días - Planeta Keto',
}: CheckoutButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <button onClick={() => setIsModalOpen(true)} className={className}>
        {children}
      </button>

      <PaymentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        amount={amount}
        currency={currency}
        productName={productName}
      />
    </>
  );
}
