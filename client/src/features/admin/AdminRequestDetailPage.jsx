import { useRef, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import Button from '../../components/Button.jsx';
import ConfirmDialog from '../../components/ConfirmDialog.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import QueryState from '../../components/QueryState.jsx';
import Skeleton from '../../components/Skeleton.jsx';
import StatusBadge from '../../components/StatusBadge.jsx';
import { formatDate, formatMoney } from '../../lib/format.js';
import usePageTitle from '../../lib/usePageTitle.js';
import { useAdminRequest, useChangeRequestStatus } from './adminApi.js';
import { NEEDS_CONFIRM, NEXT_STATUSES } from './requestStatus.js';

function RequestItemInfo({ item }) {
  const { t } = useTranslation();
  const discount = Number(item.discountPercent);

  return (
    <>
      <div>
        <p className="text-sm text-muted">{t('adminRequestDetail.product')}</p>
        <p className="mt-1 font-semibold text-ink">{item.productName}</p>
        <p className="mt-1 text-sm text-muted">{item.sku}</p>
      </div>
      <div>
        <p className="text-sm text-muted">{t('adminRequestDetail.unitPrice')}</p>
        <p className="mt-1 text-ink">{formatMoney(item.unitPrice)}</p>
        {discount > 0 && <p className="mt-1 text-sm text-muted">-{discount}%</p>}
      </div>
      <div>
        <p className="text-sm text-muted">{t('adminRequestDetail.quantity')}</p>
        <p className="mt-1 text-ink">{item.quantity}</p>
      </div>
      <div>
        <p className="text-sm text-muted">{t('adminRequestDetail.lineTotal')}</p>
        <p className="mt-1 font-semibold text-ink">{formatMoney(item.lineTotal)}</p>
      </div>
    </>
  );
}

export default function AdminRequestDetailPage() {
  const { id } = useParams();
  const location = useLocation();
  const { t } = useTranslation();
  const query = useAdminRequest(id);
  const mutation = useChangeRequestStatus();
  const request = query.data;
  const [dialogStatus, setDialogStatus] = useState(null);
  const [mutationError, setMutationError] = useState(null);
  const buttonRefs = useRef({});
  const backToList = `/admin/requests${location.search}`;

  usePageTitle(
    request
      ? t('adminRequestDetail.title', { reference: request.reference })
      : t('adminRequests.title'),
  );

  function closeDialog() {
    setDialogStatus(null);
    if (dialogStatus) buttonRefs.current[dialogStatus]?.focus();
  }

  function changeStatus(status) {
    setMutationError(null);
    if (NEEDS_CONFIRM.includes(status)) {
      setDialogStatus(status);
      return;
    }
    submitStatus(status);
  }

  function submitStatus(status) {
    mutation.mutate(
      { id, status },
      {
        onSuccess: () => {
          buttonRefs.current[status]?.focus();
          setDialogStatus(null);
          toast.success(t('adminRequestDetail.changed'));
          setMutationError(null);
        },
        onError: (error) => {
          setDialogStatus(null);
          if (error.response?.status === 409) {
            setMutationError(t('adminRequestDetail.invalidTransition'));
            query.refetch();
          } else {
            setMutationError(error.response?.data?.error?.message ?? t('common.genericError'));
          }
        },
      },
    );
  }

  const skeleton = (
    <div className="space-y-8">
      <Skeleton className="h-6 w-40" />
      <Skeleton className="h-20 w-2/3" />
      <Skeleton className="h-40 w-full" />
      <Skeleton className="h-64 w-full" />
      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    </div>
  );

  if (query.error?.response?.status === 404) {
    return (
      <EmptyState
        title={t('adminRequestDetail.notFoundTitle')}
        text={t('adminRequestDetail.notFoundText')}
        action={
          <Button as={Link} to={backToList}>
            {t('adminRequestDetail.back')}
          </Button>
        }
      />
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
      <QueryState query={query} skeleton={skeleton}>
        {(item) => (
          <>
            <Link to={backToList} className="text-sm text-ink underline hover:text-accent">
              {t('adminRequestDetail.back')}
            </Link>
            <header className="mt-6">
              <div className="flex flex-wrap items-center gap-4">
                <h1 className="font-display text-4xl font-bold text-ink">
                  {t('adminRequestDetail.title', { reference: item.reference })}
                </h1>
                <StatusBadge status={item.status} />
              </div>
              <p className="mt-3 text-sm text-muted">
                {t('adminRequestDetail.receivedOn', { date: formatDate(item.createdAt) })}
              </p>
              <p className="mt-2 text-muted">
                {item.handledBy
                  ? t('adminRequestDetail.handledBy', { name: item.handledBy.fullName })
                  : t('adminRequestDetail.notHandled')}
              </p>
              {item.emailSentAt === null && (
                <p role="alert" className="mt-5 rounded-xl bg-surface p-4 text-sm text-muted">
                  {t('adminRequestDetail.emailNotSent')}
                </p>
              )}
            </header>

            <section className="mt-10 rounded-3xl border border-line bg-white p-6">
              <h2 className="font-display text-2xl font-bold text-ink">
                {t('adminRequestDetail.customer')}
              </h2>
              <dl className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <dt className="text-sm text-muted">{t('adminRequestDetail.name')}</dt>
                  <dd className="mt-1 text-ink">{item.customerName}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted">{t('adminRequestDetail.company')}</dt>
                  <dd className="mt-1 text-ink">{item.customerCompany || t('adminRequests.noCompany')}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted">{t('adminRequestDetail.email')}</dt>
                  <dd className="mt-1">
                    <a className="text-ink underline hover:text-accent" href={`mailto:${item.customerEmail}`}>
                      {item.customerEmail}
                    </a>
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-muted">{t('adminRequestDetail.phone')}</dt>
                  <dd className="mt-1">
                    {item.customerPhone ? (
                      <a className="text-ink underline hover:text-accent" href={`tel:${item.customerPhone}`}>
                        {item.customerPhone}
                      </a>
                    ) : (
                      <span className="text-ink">{t('adminRequestDetail.noPhone')}</span>
                    )}
                  </dd>
                </div>
              </dl>
            </section>

            <section className="mt-10">
              <h2 className="font-display text-2xl font-bold text-ink">
                {t('adminRequestDetail.items')}
              </h2>
              <div className="mt-5 hidden overflow-x-auto rounded-3xl border border-line bg-white md:block">
                <table className="w-full text-left">
                  <thead className="border-b border-line bg-surface text-sm text-muted">
                    <tr>
                      <th className="px-6 py-4 font-medium">{t('adminRequestDetail.product')}</th>
                      <th className="px-6 py-4 font-medium">{t('adminRequestDetail.unitPrice')}</th>
                      <th className="px-6 py-4 font-medium">{t('adminRequestDetail.discount')}</th>
                      <th className="px-6 py-4 font-medium">{t('adminRequestDetail.quantity')}</th>
                      <th className="px-6 py-4 font-medium">{t('adminRequestDetail.lineTotal')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {item.items.map((requestItem) => {
                      const discount = Number(requestItem.discountPercent);
                      return (
                        <tr key={requestItem.productId} className="border-b border-line last:border-0">
                          <td className="px-6 py-5">
                            <p className="font-semibold text-ink">{requestItem.productName}</p>
                            <p className="mt-1 text-sm text-muted">{requestItem.sku}</p>
                          </td>
                          <td className="px-6 py-5 text-ink">{formatMoney(requestItem.unitPrice)}</td>
                          <td className="px-6 py-5 text-muted">{discount > 0 && `-${discount}%`}</td>
                          <td className="px-6 py-5 text-ink">{requestItem.quantity}</td>
                          <td className="px-6 py-5 font-semibold text-ink">{formatMoney(requestItem.lineTotal)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="space-y-4 md:hidden">
                {item.items.map((requestItem) => (
                  <article key={requestItem.productId} className="rounded-3xl border border-line bg-white p-6">
                    <RequestItemInfo item={requestItem} />
                  </article>
                ))}
              </div>
            </section>

            <div className="mt-10 grid gap-6 lg:grid-cols-2">
              <section className="rounded-3xl border border-line bg-white p-6">
                <h2 className="font-display text-2xl font-bold text-ink">
                  {t('adminRequestDetail.notes')}
                </h2>
                <p className="mt-4 whitespace-pre-line leading-7 text-muted">
                  {item.notes || t('adminRequestDetail.noNotes')}
                </p>
              </section>
              <section className="rounded-3xl border border-line bg-surface p-6">
                <h2 className="font-display text-2xl font-bold text-ink">
                  {t('adminRequestDetail.total')}
                </h2>
                <p className="mt-4 font-display text-3xl font-bold text-ink">
                  {formatMoney(item.estimatedTotal)}
                </p>
              </section>
            </div>

            <section className="mt-10 rounded-3xl border border-line bg-white p-6">
              <h2 className="font-display text-2xl font-bold text-ink">
                {t('adminRequestDetail.statusTitle')}
              </h2>
              <p className="mt-4 text-sm text-muted">{t('adminRequestDetail.noEmail')}</p>
              {mutationError && (
                <p role="alert" className="mt-5 rounded-xl bg-surface p-3 text-sm text-red-700">
                  {mutationError}
                </p>
              )}
              {NEXT_STATUSES[item.status].length > 0 ? (
                <div className="mt-6 flex flex-wrap gap-3">
                  {NEXT_STATUSES[item.status].map((nextStatus) => (
                    <Button
                      key={nextStatus}
                      ref={(element) => { buttonRefs.current[nextStatus] = element; }}
                      type="button"
                      variant={nextStatus === 'CONFIRMED' ? 'accent' : 'ghost'}
                      disabled={mutation.isPending}
                      onClick={() => changeStatus(nextStatus)}
                    >
                      {t(`adminRequestDetail.actions.${nextStatus}`)}
                    </Button>
                  ))}
                </div>
              ) : (
                <p className="mt-6 text-muted">{t('adminRequestDetail.finalStatus')}</p>
              )}
            </section>

            <ConfirmDialog
              open={Boolean(dialogStatus)}
              onOpenChange={(open) => {
                if (!open) closeDialog();
              }}
              title={dialogStatus ? t(`adminRequestDetail.confirm.${dialogStatus}.title`) : ''}
              text={dialogStatus ? t(`adminRequestDetail.confirm.${dialogStatus}.text`) : ''}
              confirmLabel={t('adminRequestDetail.confirm.yes')}
              cancelLabel={t('admin.common.cancel')}
              onConfirm={() => submitStatus(dialogStatus)}
              loading={mutation.isPending}
            />
          </>
        )}
      </QueryState>
    </main>
  );
}
