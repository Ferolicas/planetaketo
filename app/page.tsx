import HeroSales from '@/components/home/HeroSales';
import WhyChooseUs from '@/components/home/WhyChooseUs';
import SocialProof from '@/components/home/SocialProof';
import FinalCTA from '@/components/home/FinalCTA';
import Reveal from '@/components/Reveal';

export default function HomePage() {
  return (
    <>
      {/* Hero: above-the-fold, siempre visible (sin reveal) */}
      <HeroSales />
      {/* Secciones below-the-fold: revelan al hacer scroll, visibles si no hay JS */}
      <Reveal>
        <WhyChooseUs />
      </Reveal>
      <Reveal>
        <SocialProof />
      </Reveal>
      <Reveal>
        <FinalCTA />
      </Reveal>
    </>
  );
}
