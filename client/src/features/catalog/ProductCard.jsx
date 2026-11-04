import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import Button from '../../components/Button.jsx';
import { formatMoney } from '../../lib/format.js';
import { useRequestList } from '../requestList/RequestListContext.jsx';

function ProductIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-12 w-12 text-muted"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="m4 7 8-4 8 4v10l-8 4-8-4V7Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="m4 7 8 4 8-4M12 11v10" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v14m-7-7h14" />
    </svg>
  );
}

export default function ProductCard({ product, isNew = false }) {
  const { t } = useTranslation();
  const { addItem } = useRequestList();
  const discount = Math.round(Number(product.discountPercent));
  const image = product.images?.[0];

  return (
    <article className="lift overflow-hidden rounded-3xl border border-line bg-white">
      <Link to={`/products/${product.slug}`} className="group block">
        <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-surface to-line">
          {image ? (
            <img
              src={image}
              alt={product.name}
              loading="lazy"
              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <ProductIcon />
            </div>
          )}
          <div className="absolute left-4 top-4 flex flex-wrap gap-2">
            {discount > 0 && (
              <span className="rounded-full bg-accent px-3 py-1 text-xs font-bold text-ink">
                -{discount}%
              </span>
            )}
            {isNew && (
              <span className="rounded-full bg-ink px-3 py-1 text-xs font-bold text-white">
                {t('catalog.badgeNew')}
              </span>
            )}
          </div>
        </div>
      </Link>
      <div className="p-6">
        <p className="text-sm text-muted">{product.category.name}</p>
        <Link to={`/products/${product.slug}`} className="mt-2 block">
          <h3 className="font-semibold text-ink">{product.name}</h3>
        </Link>
        <p className="mt-1 text-sm text-muted">{product.sku}</p>
        <div className="mt-4 flex flex-wrap items-baseline gap-2">
          <span className="text-xl font-bold text-ink">{formatMoney(product.finalPrice)}</span>
          {discount > 0 && (
            <span className="text-sm text-muted line-through">{formatMoney(product.price)}</span>
          )}
        </div>
        <span className="mt-3 inline-block rounded-full bg-surface px-3 py-1 text-xs text-muted">
          {t('catalog.minQty', { count: product.minQuantity })}
        </span>
        <Button
          type="button"
          className="mt-5 w-full"
          onClick={() => {
            addItem(product);
          }}
        >
          <PlusIcon />
          {t('requestList.add')}
        </Button>
      </div>
    </article>
  );
}
