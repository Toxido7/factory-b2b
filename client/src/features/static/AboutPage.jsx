import { useTranslation } from 'react-i18next';
import CtaBanner from '../home/CtaBanner.jsx';
import StatsBand from '../home/StatsBand.jsx';
import WhyUs from '../home/WhyUs.jsx';

export default function AboutPage() {
  const { t } = useTranslation();

  return (
    <div>
      <header className="mx-auto max-w-7xl px-8 pt-16">
        <h1 className="text-4xl font-bold text-ink">{t('about.title')}</h1>
        <p className="mt-4 max-w-2xl leading-7 text-muted">{t('about.intro')}</p>
      </header>
      <StatsBand />
      <WhyUs />
      <CtaBanner />
    </div>
  );
}
