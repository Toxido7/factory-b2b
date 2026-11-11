import { useEffect } from "react";
import { useLocation } from "react-router";

const DEFAULT_DESCRIPTION =
  document.head.querySelector('meta[name="description"]')?.content ?? "";

const DESCRIPTIONS = {
  "/products":
    "Parcourez le catalogue EXQGA : maroquinerie et prêt-à-porter, avec prix, remises et quantités minimales.",
  "/categories": "Toutes les catégories EXQGA : maroquinerie et prêt-à-porter.",
  "/about":
    "Découvrez l'atelier EXQGA : notre histoire, notre mission et notre savoir-faire.",
  "/quality":
    "La démarche qualité EXQGA : matières, fabrication et contrôle avant livraison.",
  "/contact": "Contactez l'équipe EXQGA par téléphone, WhatsApp ou e-mail.",
};

const PRIVATE_PREFIXES = [
  "/admin",
  "/account",
  "/request-list",
  "/login",
  "/register",
  "/verify-email",
  "/forgot-password",
  "/reset-password",
];

function setMeta(name, content) {
  let el = document.head.querySelector(`meta[name="${name}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute("name", name);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

export default function usePageMeta() {
  const { pathname } = useLocation();

  useEffect(() => {
    const isPrivate = PRIVATE_PREFIXES.some(
      (p) => pathname === p || pathname.startsWith(p + "/"),
    );

    setMeta("description", DESCRIPTIONS[pathname] ?? DEFAULT_DESCRIPTION);

    if (isPrivate) {
      setMeta("robots", "noindex, nofollow");
    } else {
      document.head.querySelector('meta[name="robots"]')?.remove();
    }

    let link = document.head.querySelector('link[rel="canonical"]');
    if (isPrivate) {
      link?.remove();
    } else {
      if (!link) {
        link = document.createElement("link");
        link.setAttribute("rel", "canonical");
        document.head.appendChild(link);
      }
      link.setAttribute("href", window.location.origin + pathname);
    }
  }, [pathname]);
}
