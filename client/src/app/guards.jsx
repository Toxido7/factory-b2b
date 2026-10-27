import { Navigate, Outlet, useLocation } from "react-router";
import { useTranslation } from "react-i18next";
import { useAuth } from "../features/auth/AuthContext.jsx";

function FullScreenLoading() {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-screen items-center justify-center text-muted">
      {t("common.loading")}
    </div>
  );
}

// Needs a logged-in user (and optionally a role)
export function RequireAuth({ role }) {
  const { user, status } = useAuth();
  const location = useLocation();

  if (status === "loading") return <FullScreenLoading />;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  if (role && user.role !== role) return <Navigate to="/" replace />;
  return <Outlet />;
}

// Only for guests (login, register...). Logged-in users are sent away.
export function GuestOnly() {
  const { user, status } = useAuth();
  const location = useLocation();

  if (status === "loading") return <FullScreenLoading />;
  if (user) {
    const back = location.state?.from?.pathname;
    return (
      <Navigate to={back ?? (user.role === "ADMIN" ? "/admin" : "/")} replace />
    );
  }
  return <Outlet />;
}
