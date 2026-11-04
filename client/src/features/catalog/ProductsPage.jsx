import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router";
import { useTranslation } from "react-i18next";
import Button from "../../components/Button.jsx";
import Drawer from "../../components/Drawer.jsx";
import EmptyState from "../../components/EmptyState.jsx";
import Input from "../../components/Input.jsx";
import Pagination from "../../components/Pagination.jsx";
import QueryState from "../../components/QueryState.jsx";
import Skeleton from "../../components/Skeleton.jsx";
import ProductCard from "./ProductCard.jsx";
import FiltersPanel from "./FiltersPanel.jsx";
import { useCategories, useProducts } from "./catalogApi.js";

const sortOptions = [
  ["newest", "shop.sortNewest"],
  ["price_asc", "shop.sortPriceAsc"],
  ["price_desc", "shop.sortPriceDesc"],
  ["name", "shop.sortName"],
];

export default function ProductsPage() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [search, setSearch] = useState(searchParams.get("q") ?? "");
  const gridRef = useRef(null);
  const pageValue = Number.parseInt(searchParams.get("page") ?? "1", 10);
  const page = Number.isNaN(pageValue) || pageValue < 1 ? 1 : pageValue;
  const filters = useMemo(
    () => ({
      category: searchParams.get("category") ?? "",
      q: searchParams.get("q") ?? "",
      minPrice: searchParams.get("minPrice") ?? "",
      maxPrice: searchParams.get("maxPrice") ?? "",
      sort: searchParams.get("sort") ?? "newest",
      page,
    }),
    [page, searchParams],
  );
  const categoriesQuery = useCategories();
  const query = useProducts(filters);
  const data = query.data;
  const total = data?.pagination?.total ?? 0;
  const categories = categoriesQuery.data ?? [];

  useEffect(() => {
    setSearch(searchParams.get("q") ?? "");
  }, [searchParams]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (search !== filters.q) updateParams({ q: search });
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    if (!gridRef.current || page === 1) return;
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    gridRef.current.scrollIntoView({
      behavior: reduced ? "auto" : "smooth",
      block: "start",
    });
  }, [page]);

  function updateParams(partial) {
    const next = new URLSearchParams(searchParams);
    Object.entries(partial).forEach(([key, value]) => {
      if (
        value === "" ||
        value === undefined ||
        value === null ||
        (key === "sort" && value === "newest")
      )
        next.delete(key);
      else next.set(key, value);
    });
    if (!Object.prototype.hasOwnProperty.call(partial, "page"))
      next.delete("page");
    setSearchParams(next);
  }

  function resetFilters() {
    setSearchParams(new URLSearchParams());
    setDrawerOpen(false);
  }

  const empty = (
    <EmptyState
      title={t("shop.noResultsTitle")}
      text={t("shop.noResultsText")}
      action={<Button onClick={resetFilters}>{t("shop.reset")}</Button>}
    />
  );

  const content = (result) => (
    <div
      className={
        query.isPlaceholderData
          ? "transition-opacity opacity-60"
          : "transition-opacity"
      }
    >
      <div
        ref={gridRef}
        className="grid scroll-mt-8 gap-6 sm:grid-cols-2 lg:grid-cols-3"
      >
        {result.products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
      <Pagination
        page={result.pagination.page}
        totalPages={result.pagination.totalPages}
        onChange={(nextPage) => updateParams({ page: nextPage })}
      />
    </div>
  );

  return (
    <main className="mx-auto max-w-7xl px-8 py-12">
      <div className="text-sm text-muted">
        {t("shop.home")} / {t("shop.title")}
      </div>
      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <h1 className="font-display text-4xl font-bold text-ink">
          {t("shop.title")}
        </h1>
        <p className="text-muted">{t("shop.count", { count: total })}</p>
      </div>
      <div className="mt-10 lg:grid lg:grid-cols-[260px_1fr] lg:gap-12">
        <aside className="hidden lg:block">
          <FiltersPanel
            filters={filters}
            categories={categories}
            onChange={updateParams}
            onReset={resetFilters}
          />
        </aside>
        <div>
          <div className="mb-8 flex flex-wrap items-end gap-4">
            <div className="min-w-[220px] flex-1">
              <Input
                id="product-search"
                label={t("shop.search")}
                placeholder={t("shop.searchPlaceholder")}
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
            <div>
              <label
                htmlFor="product-sort"
                className="mb-1 block text-sm font-medium"
              >
                {t("shop.sort")}
              </label>
              <select
                id="product-sort"
                className="min-h-12 rounded-xl border border-line bg-surface px-4 text-ink outline-none focus:border-ink"
                value={filters.sort}
                onChange={(event) => updateParams({ sort: event.target.value })}
              >
                {sortOptions.map(([value, key]) => (
                  <option key={value} value={value}>
                    {t(key)}
                  </option>
                ))}
              </select>
            </div>
            <div className="lg:hidden">
              <Button variant="ghost" onClick={() => setDrawerOpen(true)}>
                {t("shop.filters")}
              </Button>
            </div>
          </div>
          <QueryState
            query={query}
            isEmpty={(result) => result.products.length === 0}
            skeleton={
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }, (_, index) => (
                  <Skeleton key={index} className="h-[460px]" />
                ))}
              </div>
            }
            empty={empty}
          >
            {content}
          </QueryState>
        </div>
      </div>
      <Drawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        title={t("shop.filters")}
      >
        <FiltersPanel
          filters={filters}
          categories={categories}
          onChange={updateParams}
          onReset={resetFilters}
        />
        <Button className="mt-8 w-full" onClick={() => setDrawerOpen(false)}>
          {t("shop.apply")}
        </Button>
      </Drawer>
    </main>
  );
}
