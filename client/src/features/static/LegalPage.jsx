import { useTranslation } from 'react-i18next';
import PageHeader from '../../components/PageHeader.jsx';

export default function LegalPage({ titleKey, sectionKeys }) {
  const { t } = useTranslation();

  return (
    <div>
      <PageHeader title={titleKey} />
      <main className="mx-auto max-w-3xl px-8 py-16">
        <p className="text-sm text-muted">{t('legal.updated')}</p>
        <div className="mt-10 space-y-10">
          {sectionKeys.map((sectionKey) => (
            <section key={sectionKey}>
              <h2 className="font-display text-2xl font-bold text-ink">{t(sectionKey)}</h2>
              <p className="mt-3 leading-8 text-muted">{t('legal.placeholder')}</p>
            </section>
          ))}
        </div>
      </main>
    </div>
  );
}
