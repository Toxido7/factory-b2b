import { Link, NavLink, Outlet, ScrollRestoration, useLocation } from 'react-router';
import { motion } from 'motion/react';
import { Suspense, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Drawer from '../components/Drawer.jsx';
import { EASE, DURATION } from '../lib/motion.js';
import PageFallback from '../components/PageFallback.jsx';
import { PenLine } from 'lucide-react';
import RouteFocus from '../components/RouteFocus.jsx';
import usePageMeta from '../lib/usePageMeta.js';

export default function AdminLayout() {
  const { t } = useTranslation();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  usePageMeta();
  const links = [
    { to: '/admin', key: 'admin.nav.dashboard', end: true },
    { to: '/admin/categories', key: 'admin.nav.categories' },
    { to: '/admin/products', key: 'admin.nav.products' },
    { to: '/admin/requests', key: 'admin.nav.requests' },
    { to: '/admin/users', key: 'admin.nav.users' },
    { to: '/admin/content', key: 'adminContent.nav', icon: PenLine },
  ];

  function navigation(dark = true) {
    return (
      <nav aria-label={t('admin.menu')} className="flex flex-col gap-2">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.end}
            onClick={() => setMenuOpen(false)}
            className={({ isActive }) =>
              `border-l-2 px-4 py-3 font-medium focus-visible:outline-2 focus-visible:outline-accent ${
                isActive
                  ? `border-accent ${dark ? 'text-white' : 'text-ink'}`
                  : `border-transparent ${dark ? 'text-white/70 hover:text-white' : 'text-muted hover:text-ink'}`
              }`
            }
          >
            {link.icon && <link.icon aria-hidden="true" className="mr-2 inline-block h-4 w-4" />}
            {t(link.key)}
          </NavLink>
        ))}
        <div className="my-3 border-t border-white/10" />
        <Link
          to="/"
          onClick={() => setMenuOpen(false)}
          className={`border-l-2 border-transparent px-4 py-3 font-medium focus-visible:outline-2 focus-visible:outline-accent ${
            dark ? 'text-white/70 hover:text-white' : 'text-muted hover:text-ink'
          }`}
        >
          {t('admin.nav.backToSite')}
        </Link>
      </nav>
    );
  }

  return (
    <div className="min-h-screen bg-surface">
      <a
        href="#main"
        className="sr-only fixed left-4 top-4 z-50 rounded-full bg-white px-4 py-3 text-ink focus:not-sr-only focus:outline-3 focus:outline-accent"
      >
        {t('skipLink')}
      </a>
      <aside className="fixed inset-y-0 left-0 hidden w-64 bg-ink p-6 text-white lg:block">
        <p className="mb-8 text-lg font-bold">{t('admin.title')}</p>
        {navigation()}
      </aside>
      <div className="lg:pl-64">
        <header className="flex items-center justify-between bg-ink px-6 py-4 text-white lg:hidden">
          <p className="font-bold">{t('admin.title')}</p>
          <button
            type="button"
            className="rounded-full p-2 text-white focus-visible:outline-2 focus-visible:outline-accent"
            aria-label={t('admin.menu')}
            onClick={() => setMenuOpen(true)}
          >
            <svg aria-hidden="true" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </header>
        <main id="main" tabIndex={-1} className="min-h-screen p-6 outline-none lg:p-8">
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
      </div>
      <Drawer open={menuOpen} onOpenChange={setMenuOpen} title={t('admin.title')}>
        {navigation(false)}
      </Drawer>
    </div>
  );
}
