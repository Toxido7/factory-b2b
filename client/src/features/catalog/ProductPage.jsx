import { Link, useParams } from 'react-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Button from '../../components/Button.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import ProductCard from './ProductCard.jsx';
import QueryState from '../../components/QueryState.jsx';
import QuantityInput from '../../components/QuantityInput.jsx';
import Skeleton from '../../components/Skeleton.jsx';
import { formatMoney } from '../../lib/format.js';
import usePageTitle from '../../lib/usePageTitle.js';
import ProductGallery from './ProductGallery.jsx';
import { useProduct, useProducts } from './catalogApi.js';

export default function ProductPage() {
  const { slug } = useParams();
  const { t } = useTranslation();
  const query = useProduct(slug);
  const product = query.data;
  const relatedQuery = useProducts({
    category: product?.category.slug ?? '',
    limit: 5,
    page: 1,
    enabled: Boolean(product),
  });
  const [quantity, setQuantity] = useState(product?.minQuantity ?? 1);

  useEffect(() => {
    setQuantity(product?.minQuantity ?? 1);
  }, [product?.id, product?.minQuantity]);

  usePageTitle(product?.name ?? t('shop.title'));

  if (query.error?.response?.status === 404) {
    return (
      <EmptyState
        title={t('product.notFoundTitle')}
        text={t('product.notFoundText')}
        action={
          <Button as={Link} to="/products">
            {t('product.backToCatalog')}
          </Button>
        }
      />
    );
  }

  const skeleton = (
    <div className="grid gap-12 lg:grid-cols-2">
      <Skeleton className="aspect-square" />
      <div className="space-y-5">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-14 w-3/4" />
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-14 w-full" />
      </div>
    </div>
  );

  return (
    <main className="mx-auto max-w-7xl px-8 py-12">
      <QueryState query={query} skeleton={skeleton}>
        {(item) => {
          const discount = Math.round(Number(item.discountPercent));
          const estimate = (Number(item.finalPrice) * quantity).toFixed(2);
          const related = (relatedQuery.data?.products ?? [])
            .filter((relatedProduct) => relatedProduct.id !== item.id)
            .slice(0, 4);

          return (
            <>
              <div className="text-sm text-muted">
                <Link to="/products" className="hover:text-accent">{t('shop.home')}</Link>
                {' / '}
                <Link to={`/products?category=${encodeURIComponent(item.category.slug)}`} className="hover:text-accent">
                  {t('shop.title')}
                </Link>
                {' / '}
                <span>{item.category.name} / {item.name}</span>
              </div>
              <div className="mt-8 grid gap-12 lg:grid-cols-2">
                <ProductGallery images={item.images} name={item.name} />
                <div>
                  <p className="text-sm text-muted">{item.category.name}</p>
                  <h1 className="mt-3 font-display text-4xl font-bold text-ink">{item.name}</h1>
                  <p className="mt-3 text-sm text-muted">{t('product.reference')}: {item.sku}</p>
                  <div className="mt-8 flex flex-wrap items-center gap-3">
                    <span className="font-display text-3xl font-bold text-ink">{formatMoney(item.finalPrice)}</span>
                    {discount > 0 && (
                      <>
                        <span className="text-muted line-through">{formatMoney(item.price)}</span>
                        <span className="rounded-full bg-accent px-3 py-1 text-sm font-semibold text-ink">
                          {t('product.discount', { percent: discount })}
                        </span>
                      </>
                    )}
                  </div>
                  <span className="mt-4 inline-block rounded-full bg-surface px-3 py-1 text-sm text-muted">
                    {t('product.minOrder', { count: item.minQuantity })}
                  </span>
                  <div className="mt-8 max-w-xs">
                    <QuantityInput
                      value={quantity}
                      min={item.minQuantity}
                      label={t('product.quantity')}
                      onChange={setQuantity}
                    />
                  </div>
                  <div className="mt-6">
                    <p className="font-semibold text-ink">
                      {t('product.estimate')}: {formatMoney(estimate)}
                    </p>
                    <p className="mt-1 text-sm text-muted">{t('product.estimateNote')}</p>
                  </div>
                  <Button
                    type="button"
                    className="mt-8 w-full"
                    onClick={() => {
                      // wired in stage F4
                    }}
                  >
                    {t('catalog.addToList')}
                  </Button>
                </div>
              </div>
              <section className="mt-20 max-w-3xl">
                <h2 className="font-display text-2xl font-bold text-ink">{t('product.description')}</h2>
                <p className="mt-4 whitespace-pre-line leading-8 text-muted">
                  {item.description || t('product.noDescription')}
                </p>
              </section>
              {related.length > 0 && (
                <section className="mt-20">
                  <h2 className="font-display text-2xl font-bold text-ink">{t('product.related')}</h2>
                  <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    {related.map((relatedProduct) => (
                      <ProductCard key={relatedProduct.id} product={relatedProduct} />
                    ))}
                  </div>
                </section>
              )}
            </>
          );
        }}
      </QueryState>
    </main>
  );
}
