'use client';

import { useEffect, useRef, useState } from 'react';

// ============================================================
// Revela su contenido al entrar en viewport. CLAVE: el contenido es visible por
// defecto (clase .reveal = opacity:1); solo si hay JS (html.js, añadido antes del
// primer pintado) se oculta y se revela. Así NUNCA hay página en blanco para
// SEO/no-JS/hidratación lenta, y respeta prefers-reduced-motion (en globals.css).
// No usar en el hero/above-the-fold: eso va siempre visible.
// ============================================================
export default function Reveal({
  children,
  className = '',
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`reveal ${visible ? 'is-visible' : ''} ${className}`}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  );
}
