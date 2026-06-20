import type { Metadata } from 'next';
import HeroSales from '@/components/home/HeroSales';
import WhyChooseUs from '@/components/home/WhyChooseUs';
import SocialProof from '@/components/home/SocialProof';
import FinalCTA from '@/components/home/FinalCTA';
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
      {/* Hero siempre visible; las secciones de abajo revelan sus tarjetas al scroll */}
      <HeroSales />
      <WhyChooseUs />
      <SocialProof />
      <FinalCTA />
    </>
  );
}
