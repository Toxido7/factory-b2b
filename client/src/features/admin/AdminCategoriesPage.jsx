import { useEffect, useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import Button from '../../components/Button.jsx';
import ConfirmDialog from '../../components/ConfirmDialog.jsx';
import Drawer from '../../components/Drawer.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import Input from '../../components/Input.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import QueryState from '../../components/QueryState.jsx';
import Select from '../../components/Select.jsx';
import { showServerError } from '../../lib/formErrors.js';
import usePageTitle from '../../lib/usePageTitle.js';
import {
  useAdminCategories,
  useCreateCategory,
  useUpdateCategory,
} from './adminApi.js';
import { categorySchema } from '../auth/schemas.js';

function CategoryForm({ categories, category, mutation, onSaved }) {
  const { t } = useTranslation();
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(categorySchema),
    defaultValues: { name: '', description: '', parentId: '' },
  });

  useEffect(() => {
    reset({
      name: category?.name ?? '',
      description: category?.description ?? '',
      parentId: category?.parentId ?? '',
    });
  }, [category, reset]);

  async function submit(values) {
    try {
      if (category) {
        await mutation.mutateAsync({
          id: category.id,
          body: {
            name: values.name.trim(),
            description: values.description.trim() || null,
            parentId: values.parentId || null,
          },
        });
      } else {
        await mutation.mutateAsync(values);
      }
      onSaved();
    } catch (error) {
      showServerError(error, setError);
    }
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-5" noValidate>
      {errors.root?.message && (
        <p role="alert" className="rounded-xl bg-surface p-3 text-sm text-red-700">
          {errors.root.message}
        </p>
      )}
      <Input
        id="category-name"
        label={t('adminCategories.name')}
        error={errors.name?.message}
        {...register('name')}
      />
      <div>
        <label htmlFor="category-description" className="mb-1 block text-sm font-medium">
          {t('adminCategories.description')}
        </label>
        <textarea
          id="category-description"
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
      <Select
        id="category-parent"
        label={t('adminCategories.parent')}
        error={errors.parentId?.message}
        {...register('parentId')}
      >
        <option value="">{t('adminCategories.noParent')}</option>
        {categories
          .filter((item) => item.id !== category?.id)
          .map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
      </Select>
      <Button type="submit" disabled={isSubmitting || mutation.isPending}>
        {t('admin.common.save')}
      </Button>
    </form>
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

export default function AdminCategoriesPage() {
  const { t } = useTranslation();
  const query = useAdminCategories();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [hideCategory, setHideCategory] = useState(null);
  const [saved, setSaved] = useState(false);
  const newButtonRef = useRef(null);
  const editButtonRefs = useRef(new Map());

  usePageTitle(t('adminCategories.title'));

  const categories = query.data ?? [];
  const parentNames = useMemo(
    () => new Map(categories.map((category) => [category.id, category.name])),
    [categories],
  );

  function openCreate() {
    setSaved(false);
    setSelectedCategory(null);
    setDrawerOpen(true);
  }

  function openEdit(category) {
    setSaved(false);
    setSelectedCategory(category);
    setDrawerOpen(true);
  }

  function closeDrawer(open) {
    setDrawerOpen(open);
    if (!open) {
      setTimeout(() => {
        const target = selectedCategory
          ? editButtonRefs.current.get(selectedCategory.id)
          : newButtonRef.current;
        target?.focus();
      }, 0);
    }
  }

  async function hideSelected() {
    await updateCategory.mutateAsync({
      id: hideCategory.id,
      body: { isActive: false },
    });
    setHideCategory(null);
  }

  function renderActions(category) {
    const updating = updateCategory.isPending;
    return (
      <div className="flex flex-wrap gap-3">
        <Button
          variant="ghost"
          className="min-h-10 px-4 text-sm"
          disabled={updating}
          ref={(element) => {
            if (element) editButtonRefs.current.set(category.id, element);
            else editButtonRefs.current.delete(category.id);
          }}
          onClick={() => openEdit(category)}
        >
          {t('admin.common.edit')}
        </Button>
        {category.isActive ? (
          <Button
            variant="ghost"
            className="min-h-10 px-4 text-sm"
            disabled={updating}
            onClick={() => setHideCategory(category)}
          >
            {t('admin.common.hide')}
          </Button>
        ) : (
          <Button
            variant="ghost"
            className="min-h-10 px-4 text-sm"
            disabled={updating}
            onClick={() => updateCategory.mutate({ id: category.id, body: { isActive: true } })}
          >
            {t('admin.common.show')}
          </Button>
        )}
      </div>
    );
  }

  const empty = (
    <EmptyState
      title={t('adminCategories.emptyTitle')}
      text={t('adminCategories.emptyText')}
      action={<Button onClick={openCreate}>{t('adminCategories.new')}</Button>}
    />
  );

  return (
    <div>
      <PageHeader title="adminCategories.title" intro="adminCategories.intro" />
      <main className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            {saved && <p role="status" className="text-sm text-muted">{t('adminCategories.saved')}</p>}
          </div>
          <Button ref={newButtonRef} onClick={openCreate}>{t('adminCategories.new')}</Button>
        </div>
        <QueryState query={query} isEmpty={(items) => items.length === 0} empty={empty}>
          {(items) => (
            <>
              <div className="hidden overflow-x-auto rounded-3xl border border-line bg-white md:block">
                <table className="w-full text-left">
                  <thead className="border-b border-line bg-surface text-sm text-muted">
                    <tr>
                      <th className="px-6 py-4 font-medium">{t('adminCategories.colName')}</th>
                      <th className="px-6 py-4 font-medium">{t('adminCategories.colParent')}</th>
                      <th className="px-6 py-4 font-medium">{t('adminCategories.colStatus')}</th>
                      <th className="px-6 py-4 font-medium">{t('adminCategories.colActions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((category) => (
                      <tr key={category.id} className="border-b border-line last:border-0">
                        <td className="px-6 py-5">
                          <p className="font-semibold text-ink">{category.name}</p>
                          <p className="text-sm text-muted">{category.slug}</p>
                        </td>
                        <td className="px-6 py-5 text-ink">{parentNames.get(category.parentId) ?? '-'}</td>
                        <td className="px-6 py-5"><StatusPill active={category.isActive} /></td>
                        <td className="px-6 py-5">{renderActions(category)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="space-y-4 md:hidden">
                {items.map((category) => (
                  <article key={category.id} className="rounded-3xl border border-line bg-white p-6">
                    <p className="font-semibold text-ink">{category.name}</p>
                    <p className="text-sm text-muted">{category.slug}</p>
                    <dl className="mt-5 grid gap-4 sm:grid-cols-2">
                      <div><dt className="text-sm text-muted">{t('adminCategories.colParent')}</dt><dd className="mt-1">{parentNames.get(category.parentId) ?? '-'}</dd></div>
                      <div><dt className="text-sm text-muted">{t('adminCategories.colStatus')}</dt><dd className="mt-1"><StatusPill active={category.isActive} /></dd></div>
                    </dl>
                    <div className="mt-5">{renderActions(category)}</div>
                  </article>
                ))}
              </div>
            </>
          )}
        </QueryState>
      </main>
      <Drawer
        open={drawerOpen}
        onOpenChange={closeDrawer}
        title={t(selectedCategory ? 'adminCategories.editTitle' : 'adminCategories.newTitle')}
      >
        <CategoryForm
          categories={categories}
          category={selectedCategory}
          mutation={selectedCategory ? updateCategory : createCategory}
          onSaved={() => {
            closeDrawer(false);
            setSaved(true);
          }}
        />
      </Drawer>
      <ConfirmDialog
        open={Boolean(hideCategory)}
        onOpenChange={(open) => {
          if (!open) setHideCategory(null);
        }}
        title={t('adminCategories.hideTitle')}
        text={t('adminCategories.hideText')}
        confirmLabel={t('adminCategories.hideConfirm')}
        cancelLabel={t('admin.common.cancel')}
        onConfirm={hideSelected}
        loading={updateCategory.isPending}
        danger
      />
    </div>
  );
}
