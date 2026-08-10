import AdSenseScript from '@/components/ads/AdSenseScript';
import GuideStrip from '@/components/GuideStrip';

/**
 * Layout de la sección de recetas. Aquí (y en /blog) se carga AdSense —
 * NUNCA en la landing del libro. La tira superior enlaza la guía pilar
 * desde las 64+ recetas (enlazado interno del clúster keto).
 */
export default function RecetasLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AdSenseScript />
      <GuideStrip />
      {children}
    </>
  );
}
