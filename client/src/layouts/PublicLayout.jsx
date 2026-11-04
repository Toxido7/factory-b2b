import { Link, NavLink, Outlet } from "react-router";
import { useTranslation } from "react-i18next";
import Button from "../components/Button.jsx";
import { useAuth } from "../features/auth/AuthContext.jsx";

const links = [
  { to: "/products", key: "nav.products" },
  { to: "/about", key: "nav.about" },
  { to: "/quality", key: "nav.quality" },
  { to: "/contact", key: "nav.contact" },
];

export default function PublicLayout() {
  const { t } = useTranslation();
  const { user, status, logout } = useAuth();

  return (
    <div className="flex min-h-screen flex-col">
      <div className="hidden bg-navy text-sm text-white/70 md:block">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-8 py-2">
          <span>{t('topbar.text')}</span>
          <span>{t('topbar.phone')}</span>
        </div>
      </div>
      <header className="border-b border-line">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-8 py-4">
          <Link to="/" className="text-lg font-bold">
            {t("brand.name")}
          </Link>
          <nav className="flex gap-6 font-medium">
            {links.map((l) => (
              <NavLink key={l.to} to={l.to} className="hover:underline">
                {t(l.key)}
              </NavLink>
            ))}
          </nav>
          {status === "loading" ? (
            <div className="h-12 w-24" />
          ) : user ? (
            <div className="flex items-center gap-4">
              {user.role === "ADMIN" && (
                <Link to="/admin" className="font-medium hover:underline">
                  {t("nav.admin")}
                </Link>
              )}
              <span className="text-sm text-muted">{user.fullName}</span>
              <Button variant="ghost" onClick={logout}>
                {t("nav.logout")}
              </Button>
            </div>
          ) : (
            <Button as={Link} to="/login">
              {t("nav.login")}
            </Button>
          )}
        </div>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="bg-navy px-8 py-14 text-white/70">
        <div className="mx-auto grid max-w-7xl gap-10 md:grid-cols-4">
          <div>
            <p className="text-lg font-bold text-white">{t('brand.name')}</p>
            <p className="mt-4 max-w-xs leading-7">{t('footer.tagline')}</p>
          </div>
          <div>
            <h2 className="font-bold text-white">{t('footer.shop')}</h2>
            <nav className="mt-4 flex flex-col gap-3">
              <Link to="/products" className="hover:text-white">{t('footer.allProducts')}</Link>
              <Link to="/products" className="hover:text-white">{t('footer.categories')}</Link>
              <Link to="/account/requests" className="hover:text-white">{t('footer.myRequests')}</Link>
            </nav>
          </div>
          <div>
            <h2 className="font-bold text-white">{t('footer.company')}</h2>
            <nav className="mt-4 flex flex-col gap-3">
              <Link to="/about" className="hover:text-white">{t('footer.about')}</Link>
              <Link to="/quality" className="hover:text-white">{t('footer.quality')}</Link>
              <Link to="/contact" className="hover:text-white">{t('footer.contact')}</Link>
            </nav>
          </div>
          <div>
            <h2 className="font-bold text-white">{t('footer.contact')}</h2>
            <div className="mt-4 flex flex-col gap-3">
              <span>{t('footer.address')}</span>
              <span>{t('footer.phone')}</span>
              <span>{t('footer.email')}</span>
            </div>
          </div>
        </div>
        <div className="mx-auto mt-12 flex max-w-7xl flex-col gap-4 border-t border-white/15 pt-6 text-sm md:flex-row md:items-center md:justify-between">
          <span>{t('brand.legal')}</span>
          <div className="flex gap-5">
            <Link to="/privacy" className="hover:text-white">{t('footer.privacy')}</Link>
            <Link to="/terms" className="hover:text-white">{t('footer.terms')}</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
