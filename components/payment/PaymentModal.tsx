'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { X, CheckCircle, ShieldCheck, Clock, AlertCircle } from 'lucide-react';
import { useCheckoutRegion, regionDisplay } from '@/lib/hooks/useCheckoutRegion';

// Los SDKs de pago son de navegador: cargarlos solo en cliente (sin SSR).
const StripeEmbedded = dynamic(() => import('./StripeEmbedded'), { ssr: false });
const MercadoPagoBrick = dynamic(() => import('./MercadoPagoBrick'), { ssr: false });
const HotmartEmbed = dynamic(() => import('./HotmartEmbed'), { ssr: false });

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Status = 'paying' | 'success' | 'pending' | 'error';

export default function PaymentModal({ isOpen, onClose }: PaymentModalProps) {
  // Detección de región 100% automática (sin switch manual): Colombia → Mercado
  // Pago; resto → Stripe.
  const { region, loading } = useCheckoutRegion();
  const [status, setStatus] = useState<Status>('paying');
  const [message, setMessage] = useState('');

  // Reset al cerrar
  useEffect(() => {
    if (!isOpen) {
      setStatus('paying');
      setMessage('');
    }
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

  const display = regionDisplay(region);
  const rawProvider = region?.provider ?? 'stripe';
  // Red de seguridad: si Hotmart aún no tiene URL de checkout configurada, el
  // resto de LATAM cae a Stripe (tarjeta en moneda local) para no bloquear ventas.
  const hotmartReady = Boolean(process.env.NEXT_PUBLIC_HOTMART_CHECKOUT_URL);
  const provider = rawProvider === 'hotmart' && !hotmartReady ? 'stripe' : rawProvider;
  // Colombia → Mercado Pago: el importe en COP es el precio local.
  const copAmount = provider === 'mercadopago' ? region?.prices.local.discount : undefined;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-0 sm:p-4">
      <div className="bg-white w-full h-full sm:h-[92vh] sm:max-w-md sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Barra superior mínima: candado + cerrar (sin producto/precio) */}
        <div className="px-5 py-3 border-b border-gray-200 flex justify-between items-center shrink-0">
          <p className="text-sm font-medium text-gray-600 flex items-center gap-1.5">
            <ShieldCheck size={16} className="text-forest" />
            Pago seguro y encriptado
          </p>
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
          {status === 'success' ? (
            <ResultState
              icon={<CheckCircle className="w-12 h-12 text-forest" />}
              title="¡Gracias por tu compra!"
              lines={[
                'Te enviaremos el enlace de descarga a tu correo en unos minutos.',
                'Revisa también la carpeta de spam por si acaso.',
              ]}
              onClose={onClose}
            />
          ) : status === 'pending' ? (
            <ResultState
              icon={<Clock className="w-12 h-12 text-amber-500" />}
              title="Pago en proceso"
              lines={[
                'Tu pago se está confirmando. En cuanto se apruebe te enviaremos el enlace de descarga por correo.',
              ]}
              onClose={onClose}
            />
          ) : status === 'error' ? (
            <div className="h-full flex flex-col items-center justify-center text-center px-8 py-10">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <AlertCircle className="w-12 h-12 text-red-500" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">No se pudo completar el pago</h3>
              <p className="text-gray-600 mb-6">{message || 'Inténtalo de nuevo con otro método.'}</p>
              <button
                onClick={() => {
                  setMessage('');
                  setStatus('paying');
                }}
                className="px-8 py-3 bg-forest text-white rounded-lg font-semibold hover:bg-forest-dark transition"
              >
                Reintentar
              </button>
            </div>
          ) : loading || !region ? (
            <Spinner label="Preparando pago seguro..." />
          ) : provider === 'mercadopago' && copAmount ? (
            <MercadoPagoBrick
              amountCop={copAmount}
              onSuccess={() => setStatus('success')}
              onPending={(m) => {
                setMessage(m);
                setStatus('pending');
              }}
              onFailure={(m) => {
                setMessage(traducirError(m));
                setStatus('error');
              }}
            />
          ) : provider === 'hotmart' ? (
            <HotmartEmbed onSuccess={() => setStatus('success')} />
          ) : (
            <StripeEmbedded
              amountLabel={display.fmt(display.discount)}
              onSuccess={() => setStatus('success')}
              onFailure={(m) => {
                setMessage(m);
                setStatus('error');
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function Spinner({ label }: { label: string }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-white z-10">
      <div className="w-14 h-14 border-4 border-forest border-t-transparent rounded-full animate-spin" />
      <p className="mt-4 text-gray-600 font-medium">{label}</p>
    </div>
  );
}

function ResultState({
  icon,
  title,
  lines,
  onClose,
}: {
  icon: React.ReactNode;
  title: string;
  lines: string[];
  onClose: () => void;
}) {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center px-8 py-10">
      <div className="w-20 h-20 bg-mint-pale rounded-full flex items-center justify-center mb-4">{icon}</div>
      <h3 className="text-2xl font-bold text-gray-900 mb-2">{title}</h3>
      {lines.map((l, i) => (
        <p key={i} className={i === 0 ? 'text-gray-600 mb-1' : 'text-sm text-gray-500 mb-1'}>
          {l}
        </p>
      ))}
      <button
        onClick={onClose}
        className="mt-6 px-8 py-3 bg-forest text-white rounded-lg font-semibold hover:bg-forest-dark transition"
      >
        Cerrar
      </button>
    </div>
  );
}

function traducirError(code: string): string {
  const map: Record<string, string> = {
    cc_rejected_insufficient_amount: 'Fondos insuficientes.',
    cc_rejected_bad_filled_card_number: 'Revisa el número de la tarjeta.',
    cc_rejected_bad_filled_security_code: 'Revisa el código de seguridad.',
    cc_rejected_bad_filled_date: 'Revisa la fecha de vencimiento.',
    cc_rejected_call_for_authorize: 'Debes autorizar el pago con tu banco.',
    cc_rejected_high_risk: 'El pago fue rechazado. Prueba con otro medio.',
  };
  return map[code] || 'El pago fue rechazado. Inténtalo con otro método.';
}
