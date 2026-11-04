import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import logo from '../../assets/logo.png';
import Button from '../../components/Button.jsx';
import { useAuth } from '../auth/AuthContext.jsx';

function MinimumIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M4 6.5h16M4 12h16M4 17.5h10" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m5 12 4 4L19 6" />
    </svg>
  );
}

export default function HeroSection() {
  const { t } = useTranslation();
  const { user } = useAuth();

  return (
    <section className="bg-ink py-20 text-white">
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-8 lg:grid-cols-2">
        <div>
          <div className="rise inline-flex items-center gap-2 rounded-full border border-accent/40 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-accent">
            <span className="h-2 w-2 rounded-full bg-accent" aria-hidden="true" />
            {t('home.badge')}
          </div>
          <h1 className="rise mt-6 max-w-2xl font-display text-5xl font-bold leading-tight text-white [animation-delay:80ms] md:text-6xl">
            {t('home.title')}
          </h1>
          <p className="rise mt-6 max-w-xl text-lg leading-8 text-white/70 [animation-delay:160ms]">
            {t('home.text')}
          </p>
          <div className="rise mt-8 flex flex-wrap gap-4 [animation-delay:240ms]">
            <Button as={Link} to="/products">
              {t('home.browse')}
            </Button>
            {!user && (
              <Button as={Link} to="/register" variant="light">
                {t('home.createAccount')}
              </Button>
            )}
          </div>
        </div>

        <div className="relative min-h-[440px]">
          <div className="flex h-[440px] items-center justify-center rounded-3xl bg-black p-8 shadow-2xl ring-1 ring-accent/30">
            <img src={logo} alt={t('home.photo')} className="h-full w-full object-contain" />
          </div>
          <div className="lift static mt-6 flex max-w-[230px] items-center gap-3 rounded-2xl bg-white p-4 shadow-xl lg:absolute lg:-left-4 lg:top-8 lg:mt-0">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent text-ink">
              <CheckIcon />
            </span>
            <span>
              <strong className="block text-sm text-ink">{t('home.floatOfferTitle')}</strong>
              <span className="text-xs text-muted">{t('home.floatOfferText')}</span>
            </span>
          </div>
          <div className="lift static mt-4 flex max-w-[230px] items-center gap-3 rounded-2xl bg-white p-4 shadow-xl lg:absolute lg:-bottom-6 lg:-right-4 lg:mt-0">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent text-ink">
              <MinimumIcon />
            </span>
            <span>
              <strong className="block text-sm text-ink">{t('home.floatMinTitle')}</strong>
              <span className="text-xs text-muted">{t('home.floatMinText')}</span>
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
