import HeroSales from '@/components/home/HeroSales';
import WhyChooseUs from '@/components/home/WhyChooseUs';
import SocialProof from '@/components/home/SocialProof';
import FinalCTA from '@/components/home/FinalCTA';

export default function HomePage() {
  return (
    <>
      {/* Hero siempre visible; las secciones de abajo revelan sus tarjetas al scroll */}
      <HeroSales />
      <WhyChooseUs />
      <SocialProof />
      <FinalCTA />
    </>
  );
}
