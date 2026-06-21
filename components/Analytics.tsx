'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useConsent } from '@/components/consent/ConsentProvider';
import { startTracking, stopTracking, trackPageview } from '@/lib/analytics/tracker';

// Analítica propia. NO arranca sin consentimiento (analyticsAllowed). El panel y
// el login no son tráfico real del sitio, así que no se miden.
const EXCLUDED = ['/admin', '/ferney', '/login'];
const isExcluded = (p: string | null) => !!p && EXCLUDED.some((e) => p.startsWith(e));

export default function Analytics() {
  const { analyticsAllowed } = useConsent();
  const pathname = usePathname();
  const shouldTrack = analyticsAllowed && !isExcluded(pathname);
  const firstPath = useRef(true);

  // Arranca/para el tracker según el consentimiento (y la zona pública).
  useEffect(() => {
    if (!shouldTrack) return;
    firstPath.current = true; // el session_start ya cuenta la página de entrada
    startTracking();
    return () => stopTracking();
  }, [shouldTrack]);

  // Pageview en cada cambio de ruta (App Router), excepto la página de entrada.
  useEffect(() => {
    if (!shouldTrack) return;
    if (firstPath.current) {
      firstPath.current = false;
      return;
    }
    trackPageview(pathname);
  }, [pathname, shouldTrack]);

  return null;
}
