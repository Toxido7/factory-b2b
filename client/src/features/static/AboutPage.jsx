import { useTranslation } from 'react-i18next';
import PageHeader from '../../components/PageHeader.jsx';
import CtaBanner from '../home/CtaBanner.jsx';
import StatsBand from '../home/StatsBand.jsx';
import WhyUs from '../home/WhyUs.jsx';
import { useSiteContent } from '../content/useSiteContent.js';

export default function AboutPage() {
  const { t } = useTranslation();
  const { text } = useSiteContent();

  return (
    <div>
      <PageHeader title="about.title" />
      <div className="bg-surface">
        <p className="mx-auto max-w-7xl px-8 pb-16 whitespace-pre-line leading-7 text-muted">
          {text('about.intro', t('about.intro'))}
        </p>
      </div>
      <StatsBand />
      <WhyUs />
      <CtaBanner />
    </div>
  );
}
