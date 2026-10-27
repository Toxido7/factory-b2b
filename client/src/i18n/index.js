import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import fr from "./fr.json";

i18n.use(initReactI18next).init({
  resources: { fr: { translation: fr } },
  lng: "fr",
  fallbackLng: "fr",
  nsSeparator: false, // lets messages contain ":" without confusing i18next
  interpolation: { escapeValue: false }, // React already escapes
});

export default i18n;
