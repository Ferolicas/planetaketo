'use client';

import { useEffect } from 'react';
import { adsenseClient } from '@/lib/site';

/**
 * Bloque de anuncio AdSense. Si no hay ca-pub configurado, muestra un marcador
 * con la etiqueta "Espacio publicitario" (densidad controlada, sin pop-ups).
 */
export default function AdSlot({ slot, className = '' }: { slot?: string; className?: string }) {
  useEffect(() => {
    if (!adsenseClient) return;
    try {
      ((window as unknown as { adsbygoogle: unknown[] }).adsbygoogle =
        (window as unknown as { adsbygoogle: unknown[] }).adsbygoogle || []).push({});
    } catch {
      /* noop */
    }
  }, []);

  if (!adsenseClient) {
    return (
      <div
        className={`my-6 grid min-h-[120px] place-items-center rounded-2xl border border-dashed border-forest/20 bg-mint-pale/15 text-xs text-forest/40 ${className}`}
      >
        Espacio publicitario
      </div>
    );
  }

  return (
    <div className={`my-6 ${className}`}>
      <span className="mb-1 block text-center text-[10px] uppercase tracking-wide text-gray-400">
        Publicidad
      </span>
      <ins
        className="adsbygoogle block"
        style={{ display: 'block' }}
        data-ad-client={adsenseClient}
        data-ad-slot={slot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}
