import type { Metadata } from 'next';
import Landing from '@/components/home/Landing';
import JsonLd from '@/components/seo/JsonLd';
import { bookSchema } from '@/lib/seo';

export const metadata: Metadata = {
  // Dominio canónico oficial SIN www (cierra el duplicado www / no-www).
  alternates: { canonical: '/' },
};

export default function HomePage() {
  return (
    <>
      <JsonLd data={bookSchema} />
      {/* La home ES el catálogo: landing mobile-first con todos los productos,
          cada tarjeta con su contenido y checkout directo (sin paso intermedio). */}
      <Landing />
    </>
  );
}
