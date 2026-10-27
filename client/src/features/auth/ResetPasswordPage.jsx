import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useSearchParams } from "react-router";
import Button from "../../components/Button.jsx";
import Input from "../../components/Input.jsx";
import { showServerError } from "../../lib/formErrors.js";
import { resetPassword } from "./authApi.js";
import { resetSchema } from "./schemas.js";

export default function ResetPasswordPage() {
  const { t } = useTranslation();
  const [params] = useSearchParams();
  const token = params.get("token");
  const [done, setDone] = useState(false);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(resetSchema) });

  async function onSubmit({ password }) {
    try {
      await resetPassword(token, password);
      setDone(true);
    } catch (err) {
      showServerError(err, setError);
    }
  }

  if (!token) {
    return (
      <div className="space-y-4 text-center">
        <h1 className="text-2xl font-bold">{t("auth.reset.invalidTitle")}</h1>
        <Link to="/forgot-password" className="underline">
          {t("auth.reset.askNew")}
        </Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className="space-y-4 text-center">
        <h1 className="text-2xl font-bold">{t("auth.reset.doneTitle")}</h1>
        <Link to="/login" className="underline">
          {t("nav.login")}
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <h1 className="text-2xl font-bold">{t("auth.reset.title")}</h1>
      <Input
        id="password"
        label={t("auth.reset.newPassword")}
        type="password"
        error={errors.password?.message}
        {...register("password")}
      />
      {errors.root && (
        <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
          {errors.root.message}
        </p>
      )}
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? t("auth.reset.submitting") : t("auth.reset.submit")}
      </Button>
    </form>
  );
}
