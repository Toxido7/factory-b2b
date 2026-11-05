import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import Button from '../../components/Button.jsx';
import ConfirmDialog from '../../components/ConfirmDialog.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import Input from '../../components/Input.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import QueryState from '../../components/QueryState.jsx';
import Select from '../../components/Select.jsx';
import { showServerError } from '../../lib/formErrors.js';
import { formatMoney } from '../../lib/format.js';
import usePageTitle from '../../lib/usePageTitle.js';
import { useAdminCategories, useAdminProducts, useUpdateProduct } from './adminApi.js';

function ProductIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-10 w-10 text-muted"
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

function StatusPill({ active }) {
  const { t } = useTranslation();

  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${
      active ? 'bg-ink text-white' : 'border border-line bg-surface text-muted'
    }`}>
      {active ? t('admin.common.active') : t('admin.common.hidden')}
    </span>
  );
}

function ProductImage({ product }) {
  const { t } = useTranslation();
  const image = product.images?.[0];

  return (
    <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-surface to-line">
      {image ? (
        <img src={image} alt={product.name} className="h-full w-full object-cover" />
      ) : (
        <>
          <ProductIcon />
          <span className="sr-only">{t('adminProducts.noPhoto')}</span>
        </>
      )}
    </div>
  );
}

function normalize(value) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function ProductInfo({ product }) {
  const { t } = useTranslation();
  const discount = Number(product.discountPercent);

  return (
    <>
      <div>
        <p className="text-sm text-muted">{t('adminProducts.colProduct')}</p>
        <p className="mt-1 font-semibold text-ink">{product.name}</p>
        <p className="text-sm text-muted">{product.sku}</p>
      </div>
      <div>
        <p className="text-sm text-muted">{t('adminProducts.colCategory')}</p>
        <p className="mt-1 text-ink">{product.category?.name ?? '-'}</p>
      </div>
      <div>
        <p className="text-sm text-muted">{t('adminProducts.colPrice')}</p>
        <p className="mt-1 font-semibold text-ink">{formatMoney(product.price)}</p>
      </div>
      <div>
        <p className="text-sm text-muted">{t('adminProducts.colMinQty')}</p>
        <p className="mt-1 text-ink">{product.minQuantity}</p>
      </div>
      <div>
        <p className="text-sm text-muted">{t('adminProducts.colDiscount')}</p>
        <p className="mt-1 text-ink">{discount > 0 ? `-${discount}%` : '-'}</p>
      </div>
      <div>
        <p className="text-sm text-muted">{t('adminProducts.colStatus')}</p>
        <div className="mt-1"><StatusPill active={product.isActive} /></div>
      </div>
    </>
  );
}

export default function AdminProductsPage() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const productsQuery = useAdminProducts();
  const categoriesQuery = useAdminCategories();
  const updateProduct = useUpdateProduct();
  const [hideProduct, setHideProduct] = useState(null);
  const [mutationError, setMutationError] = useState('');

  usePageTitle(t('adminProducts.title'));

  const products = productsQuery.data ?? [];
  const categories = categoriesQuery.data ?? [];
  const requestedCategory = searchParams.get('category') ?? '';
  const category = categories.some((item) => item.id === requestedCategory)
    ? requestedCategory
    : '';
  const requestedStatus = searchParams.get('status') ?? '';
  const status = ['active', 'hidden'].includes(requestedStatus) ? requestedStatus : '';
  const search = searchParams.get('q') ?? '';
  const normalizedSearch = normalize(search);
  const filteredProducts = useMemo(
    () => products.filter((product) => {
      const matchesSearch = !normalizedSearch
        || normalize(product.name).includes(normalizedSearch)
        || normalize(product.sku).includes(normalizedSearch);
      const matchesCategory = !category || product.categoryId === category;
      const matchesStatus = !status
        || (status === 'active' ? product.isActive : !product.isActive);
      return matchesSearch && matchesCategory && matchesStatus;
    }),
    [products, normalizedSearch, category, status],
  );
  const hasFilters = Boolean(search || category || status);

  function updateParams(key, value) {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    setSearchParams(next);
  }

  function setMutationFailure(error) {
    showServerError(error, (_field, fieldError) => {
      setMutationError(fieldError.message);
    });
  }

  async function hideSelected() {
    try {
      await updateProduct.mutateAsync({
        id: hideProduct.id,
        body: { isActive: false },
      });
      setHideProduct(null);
      setMutationError('');
    } catch (error) {
      setMutationError('');
      setMutationFailure(error);
    }
  }

  async function showProduct(product) {
    try {
      await updateProduct.mutateAsync({
        id: product.id,
        body: { isActive: true },
      });
      setMutationError('');
    } catch (error) {
      setMutationError('');
      setMutationFailure(error);
    }
  }

  function renderActions(product) {
    const updating = updateProduct.isPending;
    return (
      <div className="flex flex-wrap gap-3">
        <Button
          as={Link}
          to={`/admin/products/${product.id}`}
          variant="ghost"
          className="min-h-10 px-4 text-sm"
          aria-label={`${t('admin.common.edit')} ${product.name}`}
          disabled={updating}
        >
          {t('admin.common.edit')}
        </Button>
        {product.isActive ? (
          <Button
            type="button"
            variant="ghost"
            className="min-h-10 px-4 text-sm"
            disabled={updating}
            onClick={() => setHideProduct(product)}
          >
            {t('admin.common.hide')}
          </Button>
        ) : (
          <Button
            type="button"
            variant="ghost"
            className="min-h-10 px-4 text-sm"
            disabled={updating}
            onClick={() => showProduct(product)}
          >
            {t('admin.common.show')}
          </Button>
        )}
      </div>
    );
  }

  const empty = (
    <EmptyState
      title={hasFilters ? t('adminProducts.noResults') : t('adminProducts.emptyTitle')}
      text={hasFilters ? undefined : t('adminProducts.emptyText')}
    />
  );

  return (
    <div>
      <PageHeader title="adminProducts.title" intro="adminProducts.intro" />
      <main className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div className="grid w-full gap-4 md:grid-cols-3">
            <Input
              id="admin-products-search"
              label={t('adminProducts.searchLabel')}
              value={search}
              onChange={(event) => updateParams('q', event.target.value)}
            />
            <Select
              id="admin-products-category"
              label={t('adminProducts.categoryLabel')}
              value={category}
              onChange={(event) => updateParams('category', event.target.value)}
            >
              <option value="">{t('adminProducts.allCategories')}</option>
              {categories.map((item) => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </Select>
            <Select
              id="admin-products-status"
              label={t('adminProducts.statusLabel')}
              value={status}
              onChange={(event) => updateParams('status', event.target.value)}
            >
              <option value="">{t('admin.common.all')}</option>
              <option value="active">{t('admin.common.active')}</option>
              <option value="hidden">{t('admin.common.hidden')}</option>
            </Select>
          </div>
          <Button as={Link} to="/admin/products/new" className="shrink-0">
            {t('adminProducts.new')}
          </Button>
        </div>
        {mutationError && (
          <p role="alert" className="mb-6 rounded-xl bg-surface p-3 text-sm text-red-700">
            {mutationError}
          </p>
        )}
        <QueryState
          query={productsQuery}
          isEmpty={(items) => items.length === 0 || filteredProducts.length === 0}
          empty={empty}
        >
          {() => (
            <>
              <p className="mb-4 text-sm text-muted">
                {t('adminProducts.count', { count: filteredProducts.length })}
              </p>
              <div className="hidden overflow-x-auto rounded-3xl border border-line bg-white md:block">
                <table className="w-full text-left">
                  <thead className="border-b border-line bg-surface text-sm text-muted">
                    <tr>
                      <th className="px-6 py-4 font-medium">{t('adminProducts.colPhoto')}</th>
                      <th className="px-6 py-4 font-medium">{t('adminProducts.colProduct')}</th>
                      <th className="px-6 py-4 font-medium">{t('adminProducts.colCategory')}</th>
                      <th className="px-6 py-4 font-medium">{t('adminProducts.colPrice')}</th>
                      <th className="px-6 py-4 font-medium">{t('adminProducts.colMinQty')}</th>
                      <th className="px-6 py-4 font-medium">{t('adminProducts.colDiscount')}</th>
                      <th className="px-6 py-4 font-medium">{t('adminProducts.colStatus')}</th>
                      <th className="px-6 py-4 font-medium">{t('adminProducts.colActions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map((product) => (
                      <tr key={product.id} className="border-b border-line last:border-0">
                        <td className="px-6 py-5"><ProductImage product={product} /></td>
                        <td className="px-6 py-5">
                          <p className="font-semibold text-ink">{product.name}</p>
                          <p className="text-sm text-muted">{product.sku}</p>
                        </td>
                        <td className="px-6 py-5 text-ink">{product.category?.name ?? '-'}</td>
                        <td className="px-6 py-5 font-semibold text-ink">{formatMoney(product.price)}</td>
                        <td className="px-6 py-5 text-ink">{product.minQuantity}</td>
                        <td className="px-6 py-5 text-ink">
                          {Number(product.discountPercent) > 0 ? `-${Number(product.discountPercent)}%` : '-'}
                        </td>
                        <td className="px-6 py-5"><StatusPill active={product.isActive} /></td>
                        <td className="px-6 py-5">{renderActions(product)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="space-y-4 md:hidden">
                {filteredProducts.map((product) => (
                  <article key={product.id} className="rounded-3xl border border-line bg-white p-6">
                    <div className="flex gap-4">
                      <ProductImage product={product} />
                      <div className="min-w-0">
                        <p className="font-semibold text-ink">{product.name}</p>
                        <p className="text-sm text-muted">{product.sku}</p>
                      </div>
                    </div>
                    <dl className="mt-5 grid gap-4 sm:grid-cols-2">
                      <ProductInfo product={product} />
                    </dl>
                    <div className="mt-5">{renderActions(product)}</div>
                  </article>
                ))}
              </div>
            </>
          )}
        </QueryState>
      </main>
      <ConfirmDialog
        open={Boolean(hideProduct)}
        onOpenChange={(open) => {
          if (!open) setHideProduct(null);
        }}
        title={t('adminProducts.hideTitle')}
        text={t('adminProducts.hideText')}
        confirmLabel={t('adminProducts.hideConfirm')}
        cancelLabel={t('admin.common.cancel')}
        onConfirm={hideSelected}
        loading={updateProduct.isPending}
        danger
      />
    </div>
  );
}
