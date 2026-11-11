import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useSearchParams } from "react-router";
import { useAuth } from "./AuthContext.jsx";
import { verifyEmail } from "./authApi.js";

export default function VerifyEmailPage() {
  const { t } = useTranslation();
  const [params] = useSearchParams();
  const token = params.get("token");
  const { user, status, reloadUser } = useAuth();
  const [state, setState] = useState(token ? "loading" : "error");
  const [message, setMessage] = useState(
    token ? "" : t("auth.verify.missingToken"),
  );
  const started = useRef(false); // the token is single-use: call only once

  useEffect(() => {
    // wait until we know if the visitor is logged in
    if (!token || status === "loading" || started.current) return;
    started.current = true;
    verifyEmail(token)
      .then(async () => {
        if (status === "authed") {
          try {
            await reloadUser();
          } catch {
            // the page still says "verified"
          }
        }
        setState("ok");
      })
      .catch((err) => {
        setMessage(
          err.response?.data?.error?.message ?? t("common.genericError"),
        );
        setState("error");
      });
  }, [token, status, reloadUser]);

  return (
    <div className="space-y-4 text-center">
      {state === "loading" && <p>{t("auth.verify.loading")}</p>}
      {state === "ok" && (
        <>
          <h1 className="text-2xl font-bold">{t("auth.verify.okTitle")}</h1>
          <p className="text-muted">{t("auth.verify.okText")}</p>
          <Link to={user ? "/" : "/login"} className="underline">
            {user ? t("common.backToSite") : t("nav.login")}
          </Link>
        </>
      )}
      {state === "error" && (
        <>
          <h1 className="text-2xl font-bold">
            {t("auth.verify.invalidTitle")}
          </h1>
          <p className="text-muted">{message}</p>
          <Link to="/" className="underline">
            {t("common.backToSite")}
          </Link>
        </>
      )}
    </div>
  );
}
