import { Link, NavLink, Outlet } from "react-router";
import { useTranslation } from "react-i18next";

export default function AdminLayout() {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-screen">
      <aside className="w-60 bg-navy p-6 text-white">
        <p className="mb-6 text-lg font-bold">{t("nav.admin")}</p>
        <nav className="flex flex-col gap-3">
          <NavLink to="/admin">{t("nav.dashboard")}</NavLink>
          <Link to="/">{t("common.backToSite")}</Link>
        </nav>
      </aside>
      <main className="flex-1 bg-surface p-8">
        <Outlet />
      </main>
    </div>
  );
}
