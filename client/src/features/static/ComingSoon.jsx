import { useTranslation } from "react-i18next";

export default function ComingSoon({ title }) {
  const { t } = useTranslation();

  return <h1 className="p-8 text-3xl font-bold">{title} ({t("common.comingSoon")})</h1>;
}
