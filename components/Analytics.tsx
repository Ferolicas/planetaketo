'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

// Registra una visita (pageview) en cada carga/navegación de página pública.
// El panel y el login no se miden (no son tráfico real del sitio).
export default function Analytics() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname) return;
    if (pathname.startsWith('/admin') || pathname.startsWith('/login')) return;

    fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'pageview', path: pathname }),
      keepalive: true,
    }).catch(() => {});
  }, [pathname]);

  return null;
}
