import AdSenseScript from '@/components/ads/AdSenseScript';

/** Layout de blog: carga AdSense (igual que /recetas), nunca en la landing. */
export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AdSenseScript />
      {children}
    </>
  );
}
