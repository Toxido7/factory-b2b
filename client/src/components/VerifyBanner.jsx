import { useState } from "react";
import { useTranslation } from "react-i18next";
import { resendVerification } from "../features/auth/authApi.js";
import { useAuth } from "../features/auth/AuthContext.jsx";

export default function VerifyBanner() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [state, setState] = useState("idle"); // idle | sending | sent | error

  if (!user || user.role !== "USER" || user.emailVerified !== false)
    return null;

  async function resend() {
    setState("sending");
    try {
      await resendVerification();
      setState("sent");
    } catch {
      setState("error");
    }
  }

  return (
    <div className="bg-accent px-8 py-2 text-center text-sm font-medium text-ink">
      {t("banner.verify")}{" "}
      {state === "sent" ? (
        t("banner.sent")
      ) : (
        <button
          type="button"
          onClick={resend}
          disabled={state === "sending"}
          className="underline"
        >
          {state === "error" ? t("banner.failed") : t("banner.resend")}
        </button>
      )}
    </div>
  );
}
