import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import Button from '../../components/Button.jsx';
import ConfirmDialog from '../../components/ConfirmDialog.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import Input from '../../components/Input.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import QueryState from '../../components/QueryState.jsx';
import Select from '../../components/Select.jsx';
import Skeleton from '../../components/Skeleton.jsx';
import { showServerError } from '../../lib/formErrors.js';
import { formatMoney } from '../../lib/format.js';
import usePageTitle from '../../lib/usePageTitle.js';
import {
  useAdminCategories,
  useAdminProduct,
  useCreateProduct,
  useDeleteProductImage,
  useUpdateProduct,
  useUploadProductImage,
} from './adminApi.js';
import { productFormToApi, productSchema } from '../auth/schemas.js';

function ProductIcon() {
  return (
    <svg aria-hidden="true" className="h-12 w-12 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="m4 7 8-4 8 4v10l-8 4-8-4V7Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="m4 7 8 4 8-4M12 11v10" />
    </svg>
  );
}

function ProductPhoto({ url, name }) {
  return url ? (
    <img src={url} alt={name} className="h-full w-full object-cover" />
  ) : (
    <ProductIcon />
  );
}

function initialValues(product) {
  return {
    sku: product?.sku ?? '',
    name: product?.name ?? '',
    description: product?.description ?? '',
    categoryId: product?.categoryId ?? '',
    price: product ? String(product.price).replace('.', ',') : '',
    minQuantity: product?.minQuantity ? String(product.minQuantity) : '',
    discountPercent: product?.discountPercent && Number(product.discountPercent) > 0
      ? String(product.discountPercent).replace('.', ',')
      : '',
  };
}

function ProductFields({ register, errors, categories }) {
  const { t } = useTranslation();

  return (
    <div className="space-y-5">
      <Input id="product-sku" label={t('adminProductForm.sku')} error={errors.sku?.message} {...register('sku')} />
      <p className="-mt-3 text-sm text-muted">{t('adminProductForm.skuHint')}</p>
      <Input id="product-name" label={t('adminProductForm.name')} error={errors.name?.message} {...register('name')} />
      <div>
        <label htmlFor="product-description" className="mb-1 block text-sm font-medium">
          {t('adminProductForm.description')}
        </label>
        <textarea
          id="product-description"
          rows="5"
          className={`w-full rounded-xl border bg-surface px-4 py-3 outline-none focus:border-ink ${
            errors.description ? 'border-red-500' : 'border-line'
          }`}
          {...register('description')}
        />
        {errors.description?.message && (
          <p className="mt-1 text-sm text-red-600">
            {t(errors.description.message, { defaultValue: errors.description.message })}
          </p>
        )}
      </div>
      <Select id="product-category" label={t('adminProductForm.category')} error={errors.categoryId?.message} {...register('categoryId')}>
        <option value="">{t('adminProductForm.chooseCategory')}</option>
        {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
      </Select>
      <Input id="product-price" type="text" inputMode="decimal" label={t('adminProductForm.price')} error={errors.price?.message} {...register('price')} />
      <Input id="product-minQuantity" type="text" inputMode="numeric" label={t('adminProductForm.minQuantity')} error={errors.minQuantity?.message} {...register('minQuantity')} />
      <Input id="product-discountPercent" type="text" inputMode="decimal" label={t('adminProductForm.discount')} error={errors.discountPercent?.message} {...register('discountPercent')} />
      <p className="-mt-3 text-sm text-muted">{t('adminProductForm.discountHint')}</p>
    </div>
  );
}

function PhotosSection({ product, id }) {
  const { t } = useTranslation();
  const inputRef = useRef(null);
  const [photoError, setPhotoError] = useState('');
  const [removeUrl, setRemoveUrl] = useState(null);
  const upload = useUploadProductImage();
  const remove = useDeleteProductImage();

  function showMutationError(error) {
    showServerError(error, (_field, fieldError) => setPhotoError(fieldError.message));
  }

  async function handleFile(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setPhotoError(t('adminProductForm.photos.badType'));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setPhotoError(t('adminProductForm.photos.tooBig'));
      return;
    }
    if (product.images.length >= 5) {
      setPhotoError(t('adminProductForm.photos.tooMany'));
      return;
    }
    try {
      setPhotoError('');
      await upload.mutateAsync({ id, file });
    } catch (error) {
      showMutationError(error);
    }
  }

  async function confirmRemove() {
    try {
      const filename = removeUrl.split('/').pop();
      await remove.mutateAsync({ id, filename });
      setRemoveUrl(null);
    } catch (error) {
      showMutationError(error);
    }
  }

  return (
    <section className="rounded-3xl border border-line bg-white p-6 sm:p-8">
      <h2 className="font-display text-2xl font-bold text-ink">{t('adminProductForm.photos.title')}</h2>
      <p className="mt-2 text-sm text-muted">{t('adminProductForm.photos.hint')}</p>
      {photoError && <p role="alert" className="mt-4 rounded-xl bg-surface p-3 text-sm text-red-700">{photoError}</p>}
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {product.images.map((url, index) => (
          <div key={url} className="relative">
            <div className="aspect-square overflow-hidden rounded-2xl bg-gradient-to-br from-surface to-line">
              <ProductPhoto url={url} name={product.name} />
            </div>
            {index === 0 && <p className="mt-2 text-sm text-muted">{t('adminProductForm.photos.main')}</p>}
            <button
              type="button"
              aria-label={t('adminProductForm.photos.remove')}
              className="mt-2 text-sm font-medium text-ink underline hover:text-accent focus-visible:outline-2 focus-visible:outline-ink"
              onClick={() => setRemoveUrl(url)}
              disabled={remove.isPending}
            >
              {t('adminProductForm.photos.remove')}
            </button>
          </div>
        ))}
      </div>
      {!product.images.length && <p className="mt-6 text-sm text-muted">{t('adminProductForm.photos.empty')}</p>}
      <label className={`mt-6 inline-flex min-h-12 cursor-pointer items-center justify-center rounded-full border-2 border-ink px-6 font-semibold text-ink transition hover:bg-ink hover:text-white focus-within:outline-3 focus-within:outline-ink ${upload.isPending ? 'pointer-events-none opacity-60' : ''}`}>
        <span>{upload.isPending ? t('adminProductForm.photos.uploading') : t('adminProductForm.photos.add')}</span>
        <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={handleFile} disabled={upload.isPending} />
      </label>
      <ConfirmDialog
        open={Boolean(removeUrl)}
        onOpenChange={(open) => { if (!open) setRemoveUrl(null); }}
        title={t('adminProductForm.photos.removeTitle')}
        text={t('adminProductForm.photos.removeText')}
        confirmLabel={t('adminProductForm.photos.removeConfirm')}
        cancelLabel={t('admin.common.cancel')}
        onConfirm={confirmRemove}
        loading={remove.isPending}
        danger
      />
    </section>
  );
}

function PendingPhotosSection({ productName, pendingFiles, setPendingFiles }) {
  const { t } = useTranslation();
  const inputRef = useRef(null);
  const pendingRef = useRef(pendingFiles);
  const [photoError, setPhotoError] = useState('');
  pendingRef.current = pendingFiles;

  useEffect(() => () => {
    pendingRef.current.forEach(({ preview }) => URL.revokeObjectURL(preview));
  }, []);

  function handleFile(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setPhotoError(t('adminProductForm.photos.badType'));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setPhotoError(t('adminProductForm.photos.tooBig'));
      return;
    }
    if (pendingFiles.length >= 5) {
      setPhotoError(t('adminProductForm.photos.tooMany'));
      return;
    }
    setPhotoError('');
    setPendingFiles((current) => [
      ...current,
      { file, preview: URL.createObjectURL(file) },
    ]);
  }

  function removePending(preview) {
    URL.revokeObjectURL(preview);
    setPendingFiles((current) => current.filter((item) => item.preview !== preview));
  }

  return (
    <section className="mt-6 rounded-3xl border border-line bg-white p-6 sm:p-8">
      <h2 className="font-display text-2xl font-bold text-ink">{t('adminProductForm.photos.title')}</h2>
      <p className="mt-2 text-sm text-muted">{t('adminProductForm.photos.hint')}</p>
      <p className="mt-1 text-sm text-muted">{t('adminProductForm.photos.pendingHint')}</p>
      {photoError && <p role="alert" className="mt-4 rounded-xl bg-surface p-3 text-sm text-red-700">{photoError}</p>}
      {pendingFiles.length > 0 && (
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {pendingFiles.map(({ preview }) => (
            <div key={preview} className="relative">
              <div className="aspect-square overflow-hidden rounded-2xl bg-gradient-to-br from-surface to-line">
                <ProductPhoto url={preview} name={productName} />
              </div>
              {pendingFiles[0].preview === preview && (
                <p className="mt-2 text-sm text-muted">{t('adminProductForm.photos.main')}</p>
              )}
              <button
                type="button"
                aria-label={t('adminProductForm.photos.remove')}
                className="mt-2 text-sm font-medium text-ink underline hover:text-accent focus-visible:outline-2 focus-visible:outline-ink"
                onClick={() => removePending(preview)}
              >
                {t('adminProductForm.photos.remove')}
              </button>
            </div>
          ))}
        </div>
      )}
      <label className="mt-6 inline-flex min-h-12 cursor-pointer items-center justify-center rounded-full border-2 border-ink px-6 font-semibold text-ink transition hover:bg-ink hover:text-white focus-within:outline-3 focus-within:outline-ink">
        <span>{t('adminProductForm.photos.add')}</span>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          onChange={handleFile}
        />
      </label>
    </section>
  );
}

function ProductForm({ product, categories, mode, onSaved }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const create = useCreateProduct();
  const update = useUpdateProduct();
  const upload = useUploadProductImage();
  const mutation = mode === 'create' ? create : update;
  const [pendingFiles, setPendingFiles] = useState([]);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(productSchema), defaultValues: initialValues(product) });

  useEffect(() => {
    if (location.state?.notice) {
      toast.success(location.state.notice);
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location, navigate]);

  useEffect(() => {
    reset(initialValues(product));
  }, [product, reset]);

  async function submit(values) {
    try {
      const apiValues = productFormToApi(values);
      if (mode === 'create') {
        const created = await create.mutateAsync(apiValues);
        let failures = 0;
        setUploadingPhotos(pendingFiles.length > 0);
        for (const { file } of pendingFiles) {
          try {
            await upload.mutateAsync({ id: created.id, file });
          } catch {
            failures += 1;
          }
        }
        setUploadingPhotos(false);
        if (failures > 0) {
          toast.error(t('adminProductForm.photos.partialFail', { count: failures }));
        } else {
          toast.success(t('adminProductForm.created'));
        }
        navigate(`/admin/products/${created.id}`, {
          replace: true,
        });
      } else {
        await update.mutateAsync({
          id: product.id,
          body: {
            ...apiValues,
            description: apiValues.description ?? null,
          },
        });
        onSaved?.();
      }
    } catch (error) {
      showServerError(error, setError);
    }
  }

  return (
    <>
      <section className="rounded-3xl border border-line bg-white p-6 sm:p-8">
        <form onSubmit={handleSubmit(submit)} className="space-y-6" noValidate>
          {errors.root?.message && <p role="alert" className="rounded-xl bg-surface p-3 text-sm text-red-700">{errors.root.message}</p>}
          <ProductFields register={register} errors={errors} categories={categories} />
          <Button type="submit" disabled={isSubmitting || mutation.isPending || uploadingPhotos}>
            {uploadingPhotos ? t('adminProductForm.photos.uploading') : mode === 'create' ? t('adminProductForm.create') : t('admin.common.save')}
          </Button>
        </form>
      </section>
      {mode === 'edit' ? (
        <PhotosSection product={product} id={product.id} />
      ) : (
        <PendingPhotosSection
          productName={initialValues(product).name}
          pendingFiles={pendingFiles}
          setPendingFiles={setPendingFiles}
        />
      )}
    </>
  );
}

function CreateProductPage({ categories }) {
  const { t } = useTranslation();
  usePageTitle(t('adminProductForm.newTitle'));
  return (
    <ProductForm
      categories={categories}
      mode="create"
    />
  );
}

function EditProductPage({ id, categories }) {
  const { t } = useTranslation();
  const query = useAdminProduct(id);
  usePageTitle(query.data ? t('adminProductForm.editTitle') : t('adminProducts.title'));

  if (query.error?.response?.status === 404) {
    return <EmptyState title={t('adminProductForm.notFoundTitle')} text={t('adminProductForm.notFoundText')} action={<Button as={Link} to="/admin/products">{t('adminProductForm.back')}</Button>} />;
  }

  const skeleton = <div className="space-y-6"><Skeleton className="h-96 w-full" /><Skeleton className="h-64 w-full" /></div>;

  return (
    <QueryState query={query} skeleton={skeleton}>
      {(product) => (
        <>
          <ProductForm
            product={product}
            categories={categories}
            mode="edit"
            onSaved={() => toast.success(t('adminProductForm.saved'))}
          />
        </>
      )}
    </QueryState>
  );
}

export default function AdminProductFormPage() {
  const { id } = useParams();
  const { t } = useTranslation();
  const categoriesQuery = useAdminCategories();
  const categories = categoriesQuery.data ?? [];
  return (
    <div>
      <PageHeader
        title={id ? 'adminProductForm.editTitle' : 'adminProductForm.newTitle'}
        intro={null}
      />
      <main className="mx-auto max-w-4xl px-6 py-10 lg:px-8">
        <Link to="/admin/products" className="text-sm text-ink underline hover:text-accent">{t('adminProductForm.back')}</Link>
        <div className="mt-6">
          {id ? <EditProductPage id={id} categories={categories} /> : <CreateProductPage categories={categories} />}
        </div>
      </main>
    </div>
  );
}
