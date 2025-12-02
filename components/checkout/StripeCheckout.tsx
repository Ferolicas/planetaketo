'use client';

import { useState } from 'react';
import PaymentModal from '@/components/payment/PaymentModal';
import { Loader2 } from 'lucide-react';

interface StripeCheckoutProps {
  children: React.ReactNode;
  className?: string;
  amount?: number;
  currency?: string;
  productName?: string;
}

/**
 * Updated StripeCheckout component - Now uses embedded PaymentModal
 * No longer redirects to Stripe Checkout page
 */
export default function StripeCheckout({
  children,
  className,
  amount = 10,
  currency = 'eur',
  productName = 'Método Keto 70 Días - Planeta Keto'
}: StripeCheckoutProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleClick = () => {
    console.log('Opening payment modal...');
    setIsModalOpen(true);
  };

  const handleClose = () => {
    console.log('Closing payment modal');
    setIsModalOpen(false);
  };

  return (
    <>
      <button
        onClick={handleClick}
        className={className}
      >
        {children}
      </button>

      <PaymentModal
        isOpen={isModalOpen}
        onClose={handleClose}
        amount={amount}
        currency={currency}
        productName={productName}
      />
    </>
  );
}
