import HeroSales from '@/components/home/HeroSales';
import WhyChooseUs from '@/components/home/WhyChooseUs';
import SocialProof from '@/components/home/SocialProof';
import FinalCTA from '@/components/home/FinalCTA';

export default async function HomePage() {
  return (
    <div className="min-h-screen">
      <HeroSales />
      <WhyChooseUs />
      <SocialProof />
      <FinalCTA />
    </div>
  );
}
