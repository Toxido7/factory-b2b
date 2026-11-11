import { motion } from 'motion/react';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import Button from '../../../components/Button.jsx';
import ConfirmDialog from '../../../components/ConfirmDialog.jsx';
import PageHeader from '../../../components/PageHeader.jsx';
import QueryState from '../../../components/QueryState.jsx';
import { DURATION, EASE } from '../../../lib/motion.js';
import usePageTitle from '../../../lib/usePageTitle.js';
import { useAdminContent, useUpdateContent } from '../adminApi.js';
import { cleanDefault, CONTENT_FIELDS, GROUP_PATHS } from './contentFields.js';

const fieldName = (key) => key.replace('.', '_');

function makeSchema(fields, t) {
  return z.object(
    Object.fromEntries(
      fields.map((field) => [
        fieldName(field.key),
        z.string().max(field.maxLength, t('adminContent.errors.tooLong', { max: field.maxLength }))
          .refine(
            (value) => value === '' || field.type !== 'phone' || /^[0-9+().\-\s]{5,30}$/.test(value),
            t('adminContent.errors.phone'),
          )
          .refine(
            (value) => value === '' || field.type !== 'email' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
            t('adminContent.errors.email'),
          )
          .refine(
            (value) => value === '' || field.type !== 'url' || /^https?:\/\/\S+$/i.test(value),
            t('adminContent.errors.url'),
          ),
      ]),
    ),
  );
}

function initialValues(fields, savedFields, t) {
  return Object.fromEntries(
    fields.map((field) => {
      const saved = savedFields.find((item) => item.key === field.key)?.value;
      return [fieldName(field.key), saved === null || saved === undefined
        ? cleanDefault(field.getDefault(t))
        : saved];
    }),
  );
}

function errorMessage(error, field, t) {
  if (error === 'Invalid phone number') return t('adminContent.errors.phone');
  if (error === 'Invalid email address') return t('adminContent.errors.email');
  if (error.startsWith('Must start with')) return t('adminContent.errors.url');
  if (error.startsWith('Must be at most')) {
    return t('adminContent.errors.tooLong', { max: field.maxLength });
  }
  return error;
}

function ContentGroupForm({
  fields,
  savedFields,
  activeGroup,
  onDirtyChange,
  onSaved,
  showViewSite,
}) {
  const { t } = useTranslation();
  const [serverError, setServerError] = useState('');
  const mutation = useUpdateContent();
  const [defaults] = useState(() => initialValues(fields, savedFields, t));
  const schema = useMemo(() => makeSchema(fields, t), [fields, t]);
  const {
    register,
    handleSubmit,
    setValue,
    setError,
    watch,
    formState: { errors, dirtyFields, isDirty },
  } = useForm({ resolver: zodResolver(schema), defaultValues: defaults });

  useEffect(() => {
    onDirtyChange(isDirty);
  }, [isDirty, onDirtyChange]);

  async function submit(values) {
    setServerError('');
    const changes = {};
    for (const field of fields) {
      const name = fieldName(field.key);
      if (!dirtyFields[name]) continue;
      const value = values[name].trim();
      changes[field.key] = value === defaults[name] ? '' : value;
    }

    try {
      const freshFields = await mutation.mutateAsync(changes);
      toast.success(t('adminContent.saved'));
      onSaved(freshFields);
    } catch (error) {
      const details = error.response?.data?.error?.details;
      if (details && typeof details === 'object') {
        for (const [key, message] of Object.entries(details)) {
          const field = fields.find((item) => item.key === key);
          if (field) {
            setError(fieldName(key), { message: errorMessage(String(message), field, t) });
          }
        }
      }
      setServerError(t('adminContent.serverError'));
    }
  }

  return (
    <motion.section
      key={activeGroup}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: DURATION, ease: EASE }}
      className="mt-8"
    >
      <p className="mb-8 text-lg text-muted">{t(`adminContent.groups.${activeGroup}.intro`)}</p>
      <form onSubmit={handleSubmit(submit)} className="space-y-8" noValidate>
        {serverError && (
          <p role="alert" className="rounded-xl bg-surface p-4 text-red-700">{serverError}</p>
        )}
        {fields.map((field) => {
          const name = fieldName(field.key);
          const id = `content-${name}`;
          const errorId = `${id}-error`;
          const value = watch(name) ?? '';
          const registerProps = register(name);
          return (
            <div key={field.key}>
              <label htmlFor={id} className="block text-lg font-semibold text-ink">
                {t(`adminContent.fields.${field.group}.${field.name}.label`)}
              </label>
              <p className="mt-1 text-muted">
                {t(`adminContent.fields.${field.group}.${field.name}.help`)}
              </p>
              {field.type === 'textarea' ? (
                <textarea
                  id={id}
                  rows={5}
                  placeholder={defaults[name] ? undefined : t('adminContent.notFilled')}
                  aria-describedby={errors[name] ? errorId : undefined}
                  className={`mt-3 min-h-14 w-full rounded-xl border bg-surface px-4 py-3 text-lg outline-none focus:border-ink ${
                    errors[name] ? 'border-red-500' : 'border-line'
                  }`}
                  {...registerProps}
                />
              ) : (
                <input
                  id={id}
                  type="text"
                  inputMode={field.type === 'phone' ? 'tel' : field.type === 'email' ? 'email' : field.type === 'url' ? 'url' : undefined}
                  placeholder={defaults[name] ? undefined : t('adminContent.notFilled')}
                  aria-describedby={errors[name] ? errorId : undefined}
                  className={`mt-3 min-h-14 w-full rounded-xl border bg-surface px-4 text-lg outline-none focus:border-ink ${
                    errors[name] ? 'border-red-500' : 'border-line'
                  }`}
                  {...registerProps}
                />
              )}
              {field.type === 'textarea' && (
                <p className="mt-1 text-sm text-muted">
                  {t('adminContent.counter', { count: value.length, max: field.maxLength })}
                </p>
              )}
              {errors[name]?.message && (
                <p id={errorId} role="alert" className="mt-1 text-red-700">{errors[name].message}</p>
              )}
              <button
                type="button"
                className="mt-2 text-sm text-ink underline underline-offset-2"
                onClick={() => setValue(name, defaults[name], { shouldDirty: true })}
              >
                {t('adminContent.resetField')}
              </button>
            </div>
          );
        })}
        <div className="sticky bottom-4 flex items-center gap-4 rounded-2xl border border-line bg-white/95 p-4 shadow-lg backdrop-blur">
          <Button type="submit" variant="accent" disabled={!isDirty || mutation.isPending}>
            {mutation.isPending ? t('adminContent.saving') : t('adminContent.save')}
          </Button>
          {!isDirty && <span className="text-sm text-muted">{t('adminContent.noChanges')}</span>}
          {showViewSite && (
            <a
              href={GROUP_PATHS[activeGroup]}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-semibold text-ink underline underline-offset-2"
            >
              {t('adminContent.viewSite')}
            </a>
          )}
        </div>
      </form>
    </motion.section>
  );
}

export default function AdminContentPage() {
  const { t } = useTranslation();
  const query = useAdminContent();
  const [activeGroup, setActiveGroup] = useState('contact');
  const [dirty, setDirty] = useState(false);
  const [pendingGroup, setPendingGroup] = useState(null);
  const [viewSiteGroup, setViewSiteGroup] = useState(null);
  usePageTitle(t('adminContent.title'));

  const groups = useMemo(
    () => [...new Set((query.data ?? []).map((field) => field.group))],
    [query.data],
  );

  function chooseGroup(group) {
    if (group === activeGroup) return;
    if (dirty) {
      setPendingGroup(group);
    } else {
      setViewSiteGroup(null);
      setActiveGroup(group);
    }
  }

  return (
    <QueryState query={query}>
      {(savedFields) => {
        const fields = CONTENT_FIELDS
          .filter((field) => field.group === activeGroup)
          .map((field) => ({
            ...field,
            ...savedFields.find((saved) => saved.key === field.key),
          }));
        const savedSignature = JSON.stringify(
          savedFields
            .filter((field) => field.group === activeGroup)
            .map(({ key, value }) => [key, value]),
        );
        return (
          <>
            <PageHeader title="adminContent.title" intro="adminContent.subtitle" />
            <div className="mt-8 flex flex-wrap gap-3">
              {groups.map((group) => (
                <button
                  key={group}
                  type="button"
                  aria-current={group === activeGroup ? 'true' : undefined}
                  onClick={() => chooseGroup(group)}
                  className={`min-h-14 flex-1 basis-[calc(50%-0.75rem)] px-4 text-lg font-semibold ${
                    group === activeGroup
                      ? 'rounded-2xl bg-ink text-white'
                      : 'rounded-2xl border border-line bg-white text-ink hover:border-ink'
                  }`}
                >
                  {t(`adminContent.groups.${group}.title`)}
                </button>
              ))}
            </div>
            <ContentGroupForm
              key={`${activeGroup}-${savedSignature}`}
              fields={fields}
              savedFields={savedFields}
              activeGroup={activeGroup}
              onDirtyChange={setDirty}
              onSaved={() => {
                setDirty(false);
                setViewSiteGroup(activeGroup);
              }}
              showViewSite={viewSiteGroup === activeGroup}
            />
            <ConfirmDialog
              open={pendingGroup !== null}
              onOpenChange={(open) => !open && setPendingGroup(null)}
              title={t('adminContent.unsaved.title')}
              text={t('adminContent.unsaved.text')}
              confirmLabel={t('adminContent.unsaved.leave')}
              cancelLabel={t('adminContent.unsaved.stay')}
              onConfirm={() => {
                setViewSiteGroup(null);
                setActiveGroup(pendingGroup);
                setPendingGroup(null);
                setDirty(false);
              }}
            />
          </>
        );
      }}
    </QueryState>
  );
}
