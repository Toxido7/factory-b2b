import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';

export default function CategoryTile({ category, index }) {
  const { t } = useTranslation();
  const number = String(index + 1).padStart(2, '0');

  return (
    <Link
      to={`/products?category=${encodeURIComponent(category.slug)}`}
      className="lift relative flex min-h-40 flex-col justify-between rounded-3xl border border-line bg-surface p-6"
    >
      <span className="text-sm font-bold text-muted">{number}</span>
      <div className="flex items-end justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-ink">{category.name}</h3>
          {category.productCount !== undefined && (
            <p className="mt-1 text-sm text-muted">
              {t('catalog.productsCount', { count: category.productCount })}
            </p>
          )}
        </div>
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ink text-xl text-white">
          <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12h14m-6-6 6 6-6 6" />
          </svg>
        </span>
      </div>
    </Link>
  );
}
