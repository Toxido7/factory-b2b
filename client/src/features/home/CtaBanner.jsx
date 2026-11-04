import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import Button from '../../components/Button.jsx';
import { useAuth } from '../auth/AuthContext.jsx';

export default function CtaBanner() {
  const { t } = useTranslation();
  const { user } = useAuth();

  return (
    <section className="py-20">
      <div className="relative mx-auto flex max-w-7xl flex-col gap-8 overflow-hidden rounded-3xl bg-ink px-8 py-12 md:flex-row md:items-center md:justify-between md:px-12">
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-accent/20 blur-3xl" aria-hidden="true" />
        <div className="max-w-2xl">
          <h2 className="text-3xl font-bold text-white md:text-4xl">{t('home.cta.title')}</h2>
          <p className="mt-4 leading-7 text-white/70">{t('home.cta.text')}</p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-4">
          {!user && (
            <Button as={Link} to="/register">
              {t('home.cta.create')}
            </Button>
          )}
          <Button as={Link} to="/contact" variant="light">
            {t('home.cta.contact')}
          </Button>
        </div>
      </div>
    </section>
  );
}
