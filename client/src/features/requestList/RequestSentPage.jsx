import { Navigate, useLocation, Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import Button from '../../components/Button.jsx';
import usePageTitle from '../../lib/usePageTitle.js';

export default function RequestSentPage() {
  const { t } = useTranslation();
  const location = useLocation();
  const reference = location.state?.reference;

  usePageTitle(t('requestPage.sentTitle'));

  if (!reference) return <Navigate to="/" replace />;

  return (
    <main className="mx-auto flex max-w-3xl justify-center px-8 py-20">
      <section className="w-full rounded-3xl border border-line bg-surface p-8 text-center sm:p-12">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-ink text-accent">
          <svg aria-hidden="true" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m5 12 4 4L19 6" />
          </svg>
        </div>
        <h1 className="mt-6 font-display text-4xl font-bold text-ink">
          {t('requestPage.sentTitle')}
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-muted">{t('requestPage.sentText')}</p>
        <p className="mt-8 text-sm text-muted">{t('requestPage.sentReference')}</p>
        <p className="mt-2 font-display text-3xl font-bold text-ink">{reference}</p>
        <Button as={Link} to="/" className="mt-8">
          {t('requestPage.sentBack')}
        </Button>
      </section>
    </main>
  );
}
