import { useEffect, useState } from 'react';
import { Suspense } from 'react';
import { Link, NavLink, Outlet, ScrollRestoration, useLocation } from 'react-router';
import { motion } from 'motion/react';
import { Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import logo256 from '../assets/logo-256.webp';
import logo512 from '../assets/logo-512.webp';
import logo1024 from '../assets/logo-1024.webp';
import Button from '../components/Button.jsx';
import AccountMenu from '../components/AccountMenu.jsx';
import VerifyBanner from '../components/VerifyBanner.jsx';
import RequestListDrawer from '../components/RequestListDrawer.jsx';
import { isReal } from '../config/company.js';
import useCompany from '../features/content/useCompany.js';
import { useSiteContent } from '../features/content/useSiteContent.js';
import { useAuth } from '../features/auth/AuthContext.jsx';
import { useRequestList } from '../features/requestList/RequestListContext.jsx';
import { FLY_DURATION } from '../lib/flyToList.js';
import { EASE, DURATION } from '../lib/motion.js';
import PageFallback from '../components/PageFallback.jsx';
import SearchDialog from '../components/SearchDialog.jsx';
import RouteFocus from '../components/RouteFocus.jsx';
import usePageMeta from '../lib/usePageMeta.js';

const links = [
  { to: "/categories", key: "nav.products" },
  { to: "/about", key: "nav.about" },
  { to: "/quality", key: "nav.quality" },
  { to: "/contact", key: "nav.contact" },
];

export default function PublicLayout() {
  const { t } = useTranslation();
  const { user, status } = useAuth();
  const company = useCompany();
  const { text } = useSiteContent();
  const { count, pulse, openList } = useRequestList();
  const location = useLocation();
  const [hasScrolled, setHasScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  usePageMeta();

  useEffect(() => {
    function updateScrolledState() {
      setHasScrolled(window.scrollY > 8);
    }

    updateScrolledState();
    window.addEventListener('scroll', updateScrolledState, { passive: true });
    return () => window.removeEventListener('scroll', updateScrolledState);
  }, []);

  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#main"
        className="sr-only fixed left-4 top-4 z-50 rounded-full bg-white px-4 py-3 text-ink focus:not-sr-only focus:outline-3 focus:outline-accent"
      >
        {t('skipLink')}
      </a>
      <div className="hidden bg-accent text-sm text-ink md:block">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-8 py-2">
          <span>{text('general.topbar', t('topbar.text'))}</span>
          {isReal(company.phone) ? (
            <a href={`tel:${company.phone}`} className="hover:underline">{company.phone}</a>
          ) : (
            <span>{company.phone}</span>
          )}
        </div>
      </div>
      <VerifyBanner />
      <header className="relative sticky top-0 z-30 min-h-20 border-b border-white/10 bg-ink">
        <div
          aria-hidden="true"
          className={`pointer-events-none absolute inset-x-0 bottom-0 h-2 shadow-lg transition-opacity motion-reduce:transition-none ${
            hasScrolled ? 'opacity-100' : 'opacity-0'
          }`}
        />
        <div className="mx-auto flex max-w-7xl items-center justify-between px-8 py-4">
          <Link to="/" className="font-display text-lg font-bold uppercase tracking-[0.25em] text-white">
            {t('brand.name')}
            <span className="ml-3 inline-block h-px w-6 bg-accent align-middle" />
          </Link>
          <nav className="flex gap-6 font-medium text-white/80">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                className={({ isActive }) => (isActive ? 'text-accent' : 'hover:text-accent')}
              >
                {t(l.key)}
              </NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-4">
            <button
              type="button"
              data-request-badge
              className="relative flex h-11 w-11 items-center justify-center rounded-full text-white hover:text-accent"
              aria-label={t('requestList.open')}
              onClick={openList}
            >
              <svg aria-hidden="true" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" d="M5 8h14l-1 12H6L5 8Zm3 0a4 4 0 0 1 8 0" />
              </svg>
              {count > 0 && (
                <motion.span
                  key={pulse}
                  initial={{ scale: 1 }}
                  animate={pulse > 0 ? { scale: [1, 1.3, 1] } : { scale: 1 }}
                  transition={{ duration: 0.35, delay: pulse > 0 ? FLY_DURATION : 0, ease: EASE }}
                  className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-xs font-bold text-ink"
                >
                  {count}
                </motion.span>
              )}
            </button>
            <button
              type="button"
              className="relative flex h-11 w-11 items-center justify-center rounded-full text-white hover:text-accent"
              aria-label={t('search.open')}
              onClick={() => setSearchOpen(true)}
            >
              <Search aria-hidden="true" className="h-6 w-6" />
            </button>
            {status === 'loading' ? (
              <div className="h-12 w-24" />
            ) : user ? (
              <div className="flex items-center gap-4">
                <AccountMenu />
              </div>
            ) : (
              <Button as={Link} to="/login">
                {t('nav.login')}
              </Button>
            )}
          </div>
        </div>
      </header>
      <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
      <main id="main" tabIndex={-1} className="flex-1 outline-none">
        <RouteFocus />
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: DURATION, ease: EASE }}
        >
          <Suspense fallback={<PageFallback />}>
            <Outlet />
          </Suspense>
        </motion.div>
      </main>
      <ScrollRestoration />
      <footer className="bg-ink px-8 py-14 text-white/70">
        <div className="mx-auto grid max-w-7xl gap-10 md:grid-cols-4">
          <div>
            <img
              src={logo512}
              srcSet={`${logo256} 256w, ${logo512} 512w, ${logo1024} 1024w`}
              sizes="96px"
              width={1254}
              height={1254}
              loading="lazy"
              decoding="async"
              className="h-24 w-auto"
              alt={t('brand.name')}
            />
            <p className="mt-4 max-w-xs leading-7">{text('general.tagline', t('footer.tagline'))}</p>
          </div>
          <div>
            <h2 className="font-bold text-white">{t('footer.shop')}</h2>
            <nav className="mt-4 flex flex-col gap-3">
              <Link to="/products" className="hover:text-accent">{t('footer.allProducts')}</Link>
              <Link to="/products" className="hover:text-accent">{t('footer.categories')}</Link>
              <Link to="/account/requests" className="hover:text-accent">{t('footer.myRequests')}</Link>
            </nav>
          </div>
          <div>
            <h2 className="font-bold text-white">{t('footer.company')}</h2>
            <nav className="mt-4 flex flex-col gap-3">
              <Link to="/about" className="hover:text-accent">{t('footer.about')}</Link>
              <Link to="/quality" className="hover:text-accent">{t('footer.quality')}</Link>
              <Link to="/contact" className="hover:text-accent">{t('footer.contact')}</Link>
            </nav>
          </div>
          <div>
            <h2 className="font-bold text-white">{t('footer.contact')}</h2>
            <div className="mt-4 flex flex-col gap-3">
              <span className="whitespace-pre-line">{company.address}</span>
              {isReal(company.phone) ? (
                <a href={`tel:${company.phone}`} className="hover:text-accent">{company.phone}</a>
              ) : (
                <span>{company.phone}</span>
              )}
              {isReal(company.email) ? (
                <a href={`mailto:${company.email}`} className="hover:text-accent">{company.email}</a>
              ) : (
                <span>{company.email}</span>
              )}
              {company.facebook && (
                <a
                  href={company.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Facebook"
                  className="hover:text-accent"
                >
                  Facebook
                </a>
              )}
              {company.instagram && (
                <a
                  href={company.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  className="hover:text-accent"
                >
                  Instagram
                </a>
              )}
            </div>
          </div>
        </div>
        <div className="mx-auto mt-12 flex max-w-7xl flex-col gap-4 border-t border-white/10 pt-6 text-sm md:flex-row md:items-center md:justify-between">
          <span>
            {text('general.taxNumber', '')
              ? t('brand.copyrightTax', { name: company.name, tax: text('general.taxNumber', '') })
              : t('brand.copyright', { name: company.name })}
          </span>
          <div className="flex gap-5">
            <Link to="/privacy" className="hover:text-accent">{t('footer.privacy')}</Link>
            <Link to="/terms" className="hover:text-accent">{t('footer.terms')}</Link>
          </div>
        </div>
      </footer>
      <RequestListDrawer />
    </div>
  );
}
