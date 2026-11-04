import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import Button from '../../components/Button.jsx';
import { useAuth } from '../auth/AuthContext.jsx';

function OfferIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M12 3v18m6-15H9.5a3.5 3.5 0 1 0 0 7H14.5a3.5 3.5 0 1 1 0 7H6" />
    </svg>
  );
}

function MinimumIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M4 6.5h16M4 12h16M4 17.5h10" />
    </svg>
  );
}

export default function HeroSection() {
  const { t } = useTranslation();
  const { user } = useAuth();

  return (
    <section className="py-20">
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-8 lg:grid-cols-2">
        <div>
          <div className="rise inline-flex items-center gap-2 rounded-full bg-accent/15 px-4 py-2 text-sm font-semibold text-navy">
            <span className="h-2 w-2 rounded-full bg-accent" aria-hidden="true" />
            {t('home.badge')}
          </div>
          <h1 className="rise mt-6 max-w-2xl text-5xl font-bold leading-tight text-navy [animation-delay:80ms] md:text-6xl">
            {t('home.title')}
          </h1>
          <p className="rise mt-6 max-w-xl text-lg leading-8 text-muted [animation-delay:160ms]">
            {t('home.text')}
          </p>
          <div className="rise mt-8 flex flex-wrap gap-4 [animation-delay:240ms]">
            <Button as={Link} to="/products">
              {t('home.browse')}
            </Button>
            {!user && (
              <Button as={Link} to="/register" variant="ghost">
                {t('home.createAccount')}
              </Button>
            )}
          </div>
        </div>

        <div className="relative min-h-[440px]">
          <div className="flex h-[440px] items-end rounded-3xl bg-navy p-8">
            <span className="text-sm font-semibold text-white/70">{t('home.photo')}</span>
          </div>
          <div className="lift absolute left-4 top-8 flex max-w-[230px] items-center gap-3 rounded-2xl bg-white p-4 shadow-xl md:left-8">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent text-navy">
              <OfferIcon />
            </span>
            <span>
              <strong className="block text-sm text-navy">{t('home.floatOfferTitle')}</strong>
              <span className="text-xs text-muted">{t('home.floatOfferText')}</span>
            </span>
          </div>
          <div className="lift absolute bottom-8 right-4 flex max-w-[230px] items-center gap-3 rounded-2xl bg-white p-4 shadow-xl md:right-8">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent text-navy">
              <MinimumIcon />
            </span>
            <span>
              <strong className="block text-sm text-navy">{t('home.floatMinTitle')}</strong>
              <span className="text-xs text-muted">{t('home.floatMinText')}</span>
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
