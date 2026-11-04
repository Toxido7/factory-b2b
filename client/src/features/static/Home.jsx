import CategoriesSection from '../home/CategoriesSection.jsx';
import CtaBanner from '../home/CtaBanner.jsx';
import HeroSection from '../home/HeroSection.jsx';
import HowItWorks from '../home/HowItWorks.jsx';
import NewProductsSection from '../home/NewProductsSection.jsx';

export default function Home() {
  return (
    <div>
      <HeroSection />
      <CategoriesSection />
      <NewProductsSection />
      <HowItWorks />
      <CtaBanner />
    </div>
  );
}
