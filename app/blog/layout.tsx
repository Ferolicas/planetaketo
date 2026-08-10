import AdSenseScript from '@/components/ads/AdSenseScript';
import GuideStrip from '@/components/GuideStrip';

/** Layout de blog: AdSense (igual que /recetas), nunca en la landing; y la
 *  tira que enlaza la guía pilar desde los 31 artículos del clúster. */
export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AdSenseScript />
      <GuideStrip />
      {children}
    </>
  );
}
