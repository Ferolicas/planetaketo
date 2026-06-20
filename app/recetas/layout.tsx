import AdSenseScript from '@/components/ads/AdSenseScript';

/**
 * Layout de la sección de recetas. Aquí (y en /blog) se carga AdSense —
 * NUNCA en la landing del libro.
 */
export default function RecetasLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AdSenseScript />
      {children}
    </>
  );
}
