import Script from 'next/script';
import { adsenseClient } from '@/lib/site';

/**
 * Carga el script de AdSense SOLO si hay ca-pub configurado (env).
 * Se monta en el layout de /recetas (y /blog), NUNCA en la landing.
 */
export default function AdSenseScript() {
  if (!adsenseClient) return null;
  return (
    <Script
      async
      strategy="afterInteractive"
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseClient}`}
      crossOrigin="anonymous"
    />
  );
}
