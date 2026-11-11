import { useTranslation } from 'react-i18next';
import CtaBanner from '../home/CtaBanner.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import usePageTitle from '../../lib/usePageTitle.js';
import { useSiteContent } from '../content/useSiteContent.js';

const certifications = ['cert-1', 'cert-2', 'cert-3'];
const steps = [
  ['1', 'quality.p1Title', 'quality.p1', 'quality.p1Text'],
  ['2', 'quality.p2Title', 'quality.p2', 'quality.p2Text'],
  ['3', 'quality.p3Title', 'quality.p3', 'quality.p3Text'],
];

function QualityIcon() {
  return (
    <svg aria-hidden="true" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" d="m12 3 7 3v5c0 4.5-3 7.5-7 10-4-2.5-7-5.5-7-10V6l7-3Z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" d="m8.5 11.5 2.25 2.25 4.75-5" />
    </svg>
  );
}

export default function QualityPage() {
  const { t } = useTranslation();
  const { text } = useSiteContent();
  usePageTitle(t('quality.title'));

  return (
    <div>
      <PageHeader title="quality.title" />
      <div className="bg-surface">
        <p className="mx-auto max-w-7xl px-8 pb-16 whitespace-pre-line leading-7 text-muted">
          {text('quality.intro', t('quality.intro'))}
        </p>
      </div>
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-8">
          <h2 className="font-display text-3xl font-bold text-ink">{t('quality.certTitle')}</h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {certifications.map((certification) => (
              <article key={certification} className="rounded-3xl border border-line bg-white p-8">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-ink text-accent">
                  <QualityIcon />
                </span>
                <h3 className="mt-6 font-display text-xl font-bold text-ink">
                  {text('quality.certName', t('quality.certName'))}
                </h3>
                <p className="mt-3 whitespace-pre-line leading-7 text-muted">
                  {text('quality.certText', t('quality.certText'))}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>
      <section className="bg-surface py-20">
        <div className="mx-auto max-w-7xl px-8">
          <h2 className="font-display text-3xl font-bold text-ink">{t('quality.processTitle')}</h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {steps.map(([number, title, contentKey, fallbackKey]) => (
              <article key={number} className="rounded-3xl bg-white p-8">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-accent font-bold text-ink">
                  {number}
                </span>
                <h3 className="mt-6 font-display text-xl font-bold text-ink">{t(title)}</h3>
                <p className="mt-3 whitespace-pre-line leading-7 text-muted">
                  {text(contentKey, t(fallbackKey))}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>
      <CtaBanner />
    </div>
  );
}
