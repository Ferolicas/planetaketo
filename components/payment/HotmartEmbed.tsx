'use client';

import { useEffect, useMemo, useState } from 'react';
import { getSid } from '@/lib/analytics/consent';

// ============================================================
// Checkout de Hotmart embebido dentro del modal (resto de LATAM: Perú, México,
// Chile, Argentina, Brasil… → Yape, SPEI, OXXO, PIX y demás métodos locales).
// Es un iframe del checkout de Hotmart en modo embebido (checkoutMode=2).
//
// Detección de pago: la thank-you page del producto en Hotmart se configura a
// /gracias (nuestro dominio); al cargarse dentro del iframe tras la aprobación,
// avisa al modal padre por postMessage. La entrega del libro la dispara el
// webhook de Hotmart (Resend + magic link), igual que en las otras pasarelas.
//
// Analítica: el UUID de la visita viaja a Hotmart por el parámetro `sck` (que
// Hotmart devuelve en el postback) para enlazar la venta con la visita.
// ============================================================

interface Props {
  checkoutUrl: string;
  onSuccess: () => void;
  onFailure: (msg: string) => void;
  productSlug?: string | null;
}

export default function HotmartEmbed({
  checkoutUrl: baseCheckoutUrl,
  onSuccess,
  onFailure,
  productSlug = null,
}: Props) {
  const [loaded, setLoaded] = useState(false);
  const [showFallback, setShowFallback] = useState(false);

  // Añade ?sck=<pk_sid>[~slug] (Hotmart lo devuelve en el postback) y avisa al backend.
  const checkoutUrl = useMemo(() => {
    if (!baseCheckoutUrl) return '';
    const sid = getSid();
    const sck = [sid, productSlug].filter(Boolean).join('~');
    const url = new URL(baseCheckoutUrl);
    url.searchParams.set('checkoutMode', '2');
    if (sck) url.searchParams.set('sck', sck);
    return url.toString();
  }, [baseCheckoutUrl, productSlug]);

  useEffect(() => {
    const sid = getSid();
    if (sid) {
      fetch('/api/checkout/hotmart/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: sid, productSlug: productSlug ?? undefined }),
        keepalive: true,
      }).catch(() => {});
    }
  }, [productSlug]);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type === 'planetaketo:pago-ok') onSuccess();
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [onSuccess]);

  const externalCheckoutUrl = useMemo(() => {
    if (!baseCheckoutUrl) return '';
    const sid = getSid();
    const sck = [sid, productSlug].filter(Boolean).join('~');
    const url = new URL(baseCheckoutUrl);
    if (sck) url.searchParams.set('sck', sck);
    return url.toString();
  }, [baseCheckoutUrl, productSlug]);

  useEffect(() => {
    setShowFallback(false);
    if (!checkoutUrl) return;
    const timeout = window.setTimeout(() => setShowFallback(true), 10_000);
    return () => window.clearTimeout(timeout);
  }, [checkoutUrl]);

  if (!checkoutUrl) {
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
          {showFallback && externalCheckoutUrl && (
            <a
              href={externalCheckoutUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 rounded-full bg-forest px-5 py-2.5 text-sm font-semibold text-white"
            >
              Abrir pago seguro en otra ventana
            </a>
          )}
        </div>
      )}
      <iframe
        src={checkoutUrl}
        title="Pago seguro"
        className="w-full h-full border-0"
        allow="payment *; clipboard-write"
        onLoad={() => setLoaded(true)}
        onError={() => onFailure('hotmart_load_error')}
      />
      {loaded && showFallback && externalCheckoutUrl && (
        <a
          href={externalCheckoutUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute bottom-3 left-1/2 z-20 -translate-x-1/2 whitespace-nowrap rounded-full bg-white px-4 py-2 text-xs font-semibold text-forest shadow-lg ring-1 ring-forest/20"
        >
          ¿No responde? Abrir pago seguro
        </a>
      )}
    </div>
  );
}
