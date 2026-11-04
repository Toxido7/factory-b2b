import { useTranslation } from 'react-i18next';
import PageHeader from '../../components/PageHeader.jsx';
import CtaBanner from '../home/CtaBanner.jsx';
import StatsBand from '../home/StatsBand.jsx';
import WhyUs from '../home/WhyUs.jsx';

export default function AboutPage() {
  const { t } = useTranslation();

  return (
    <div>
      <PageHeader title="about.title" intro="about.intro" />
      <StatsBand />
      <WhyUs />
      <CtaBanner />
    </div>
  );
}
