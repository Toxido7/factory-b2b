import { useState } from "react";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import Button from "../../components/Button.jsx";
import Input from "../../components/Input.jsx";
import { translateServerMessage } from "../../lib/formErrors.js";
import { useAuth } from "./AuthContext.jsx";

export default function LoginPage() {
  const { t } = useTranslation();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(
        translateServerMessage(
          err.response?.data?.error?.message ?? t("common.genericError"),
        ),
      );
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <h1 className="text-2xl font-bold">{t("auth.login.title")}</h1>
      <Input
        id="email"
        label={t("auth.email")}
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <Input
        id="password"
        label={t("auth.password")}
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      {error && (
        <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>
      )}
      <Button type="submit" className="w-full" disabled={busy}>
        {busy ? t("auth.login.submitting") : t("auth.login.submit")}
      </Button>
      <p className="text-center text-sm text-muted">
        <Link to="/forgot-password" className="underline">
          {t("auth.login.forgot")}
        </Link>
        {" · "}
        <Link to="/register" className="underline">
          {t("auth.login.create")}
        </Link>
      </p>
    </form>
  );
}
