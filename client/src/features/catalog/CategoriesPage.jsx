import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import EmptyState from "../../components/EmptyState.jsx";
import QueryState from "../../components/QueryState.jsx";
import Skeleton from "../../components/Skeleton.jsx";
import CategoryTile from "./CategoryTile.jsx";
import { useCategories } from "./catalogApi.js";

export default function CategoriesPage() {
  const { t } = useTranslation();
  const query = useCategories();

  return (
    <main className="mx-auto max-w-7xl px-8 py-16">
      <h1 className="text-4xl font-bold text-ink">
        {t("catalog.categoriesPageTitle")}
      </h1>
      <div className="mt-10">
        <QueryState
          query={query}
          isEmpty={(categories) => categories.length === 0}
          skeleton={
            <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
              {Array.from({ length: 6 }, (_, index) => (
                <Skeleton key={index} className="h-40" />
              ))}
            </div>
          }
          empty={
            <div>
              <Link
                to="/products"
                className="lift relative flex min-h-40 flex-col justify-end rounded-3xl border border-line bg-surface p-6"
              >
                <h2 className="text-xl font-bold text-ink">
                  {t("catalog.allProducts")}
                </h2>
              </Link>
              <EmptyState title={t("catalog.noCategories")} />
            </div>
          }
        >
          {(categories) => (
            <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
              <Link
                to="/products"
                className="lift relative flex min-h-40 flex-col justify-end rounded-3xl border border-line bg-surface p-6"
              >
                <h2 className="text-xl font-bold text-ink">
                  {t("catalog.allProducts")}
                </h2>
              </Link>
              {categories.map((category, index) => (
                <CategoryTile
                  key={category.id}
                  category={category}
                  index={index}
                />
              ))}
            </div>
          )}
        </QueryState>
      </div>
    </main>
  );
}
