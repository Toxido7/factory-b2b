import { Link, NavLink, Outlet, useLocation } from 'react-router';
import { motion } from 'motion/react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Drawer from '../components/Drawer.jsx';
import { EASE, DURATION } from '../lib/motion.js';

export default function AdminLayout() {
  const { t } = useTranslation();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const links = [
    { to: '/admin', key: 'admin.nav.dashboard', end: true },
    { to: '/admin/categories', key: 'admin.nav.categories' },
    { to: '/admin/products', key: 'admin.nav.products' },
    { to: '/admin/requests', key: 'admin.nav.requests' },
    { to: '/admin/users', key: 'admin.nav.users' },
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
        <main className="min-h-screen p-6 lg:p-8">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: DURATION, ease: EASE }}
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
      <Drawer open={menuOpen} onOpenChange={setMenuOpen} title={t('admin.title')}>
        {navigation(false)}
      </Drawer>
    </div>
  );
}
