'use client';

import { useEffect, useState } from 'react';

// ============================================================
// Checkout de Hotmart embebido dentro del modal (resto de LATAM: Perú, México,
// Chile, Argentina, Brasil… → Yape, SPEI, OXXO, PIX y demás métodos locales).
// Es un iframe del checkout de Hotmart en modo embebido (checkoutMode=2).
//
// Detección de pago: la thank-you page del producto en Hotmart se configura a
// /gracias (nuestro dominio); al cargarse dentro del iframe tras la aprobación,
// avisa al modal padre por postMessage. La entrega del libro la dispara el
// webhook de Hotmart (Resend + magic link), igual que en las otras pasarelas.
// ============================================================

const CHECKOUT_URL = process.env.NEXT_PUBLIC_HOTMART_CHECKOUT_URL || '';

export default function HotmartEmbed({ onSuccess }: { onSuccess: () => void }) {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type === 'planetaketo:pago-ok') onSuccess();
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [onSuccess]);

  if (!CHECKOUT_URL) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center px-8">
        <p className="text-red-600 font-semibold">El pago no está disponible ahora.</p>
        <p className="text-sm text-gray-500 mt-2">Vuelve a intentarlo más tarde o contáctanos.</p>
      </div>
    );
  }

  return (
    <div className="h-full relative bg-white">
      {!loaded && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white z-10">
          <div className="w-14 h-14 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
          <p className="mt-4 text-gray-600 font-medium">Preparando pago seguro...</p>
        </div>
      )}
      <iframe
        src={CHECKOUT_URL}
        title="Pago seguro"
        className="w-full h-full border-0"
        allow="payment *; clipboard-write"
        onLoad={() => setLoaded(true)}
      />
    </div>
  );
}
