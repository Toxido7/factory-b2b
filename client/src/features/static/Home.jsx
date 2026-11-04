import CtaBanner from '../home/CtaBanner.jsx';
import HeroSection from '../home/HeroSection.jsx';
import HowItWorks from '../home/HowItWorks.jsx';
import StatsBand from '../home/StatsBand.jsx';
import WhyUs from '../home/WhyUs.jsx';

export default function Home() {
  return (
    <div>
      <HeroSection />
      <StatsBand />
      <HowItWorks />
      <WhyUs />
      <CtaBanner />
    </div>
  );
}
