'use client';

import { useState, useEffect } from 'react';
import { X, CheckCircle, ShieldCheck } from 'lucide-react';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  currency?: string;
  productName?: string;
}

// URL del checkout de Hotmart (modo embebido, sin redirección).
// Ej: https://pay.hotmart.com/E101576748X?checkoutMode=2
const CHECKOUT_URL = process.env.NEXT_PUBLIC_HOTMART_CHECKOUT_URL || '';

export default function PaymentModal({
  isOpen,
  onClose,
  amount,
  currency = 'eur',
  productName = 'Método Keto 70 Días',
}: PaymentModalProps) {
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [isPaid, setIsPaid] = useState(false);

  // Reset al cerrar
  useEffect(() => {
    if (!isOpen) {
      setIframeLoaded(false);
      setIsPaid(false);
    }
  }, [isOpen]);

  // Detección de pago: nuestra página /gracias (cargada dentro del iframe tras
  // la aprobación, en nuestro propio dominio) avisa al padre por postMessage.
  useEffect(() => {
    if (!isOpen) return;

    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type === 'planetaketo:pago-ok') {
        setIsPaid(true);
      }
    };

    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [isOpen]);

  // Bloquea el scroll del body mientras el modal está abierto
  useEffect(() => {
    if (isOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-0 sm:p-4">
      <div className="bg-white w-full h-full sm:h-[92vh] sm:max-w-xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header — marca Planeta Keto */}
        <div className="px-5 py-4 border-b border-gray-200 flex justify-between items-center shrink-0">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 leading-tight">
              {productName}
            </h2>
            {!isPaid && (
              <p className="text-2xl font-bold text-green-600 mt-0.5">
                {amount.toFixed(2)} {currency.toUpperCase()}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition shrink-0"
            aria-label="Cerrar"
          >
            <X size={24} />
          </button>
        </div>

        {/* Cuerpo */}
        <div className="flex-1 relative bg-white overflow-hidden">
          {isPaid ? (
            <div className="h-full flex flex-col items-center justify-center text-center px-8 py-10">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="w-12 h-12 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">¡Gracias por tu compra!</h3>
              <p className="text-gray-600 mb-1">
                Te enviaremos el enlace de descarga a tu correo en unos minutos.
              </p>
              <p className="text-sm text-gray-500 mb-6">
                Revisa también la carpeta de spam por si acaso.
              </p>
              <button
                onClick={onClose}
                className="px-8 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition"
              >
                Cerrar
              </button>
            </div>
          ) : !CHECKOUT_URL ? (
            <div className="h-full flex flex-col items-center justify-center text-center px-8">
              <p className="text-red-600 font-semibold">
                El pago no está disponible en este momento.
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Vuelve a intentarlo más tarde o contáctanos.
              </p>
            </div>
          ) : (
            <>
              {!iframeLoaded && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-white z-10">
                  <div className="w-14 h-14 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
                  <p className="mt-4 text-gray-600 font-medium">Preparando pago seguro...</p>
                </div>
              )}
              <iframe
                src={CHECKOUT_URL}
                title="Pago seguro"
                className="w-full h-full border-0"
                allow="payment *; clipboard-write"
                onLoad={() => setIframeLoaded(true)}
              />
            </>
          )}
        </div>

        {/* Pie de seguridad */}
        {!isPaid && (
          <div className="px-5 py-3 border-t border-gray-100 shrink-0">
            <p className="text-xs text-gray-500 text-center flex items-center justify-center gap-1.5">
              <ShieldCheck size={14} className="text-green-600" />
              Pago 100% seguro y encriptado · Acceso inmediato por correo
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
