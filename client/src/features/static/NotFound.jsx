import { Link } from "react-router";
import { useTranslation } from "react-i18next";

export default function NotFound() {
  const { t } = useTranslation();

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold">{t("notFound.title")}</h1>
      <Link to="/" className="mt-4 inline-block underline">
        {t("common.backToHome")}
      </Link>
    </div>
  );
}
