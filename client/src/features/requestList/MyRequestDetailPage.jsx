import { Link, useParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import Button from '../../components/Button.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import QueryState from '../../components/QueryState.jsx';
import Skeleton from '../../components/Skeleton.jsx';
import StatusBadge from '../../components/StatusBadge.jsx';
import { formatDate, formatMoney } from '../../lib/format.js';
import usePageTitle from '../../lib/usePageTitle.js';
import { useMyRequest } from './requestsApi.js';

function RequestItemInfo({ item }) {
  const { t } = useTranslation();
  const discount = Number(item.discountPercent);

  return (
    <>
      <div>
        <p className="text-sm text-muted">{t('requestDetail.product')}</p>
        <p className="mt-1 font-semibold text-ink">{item.productName}</p>
        <p className="mt-1 text-sm text-muted">{item.sku}</p>
      </div>
      <div>
        <p className="text-sm text-muted">{t('requestDetail.unitPrice')}</p>
        <p className="mt-1 text-ink">{formatMoney(item.unitPrice)}</p>
        {discount > 0 && (
          <p className="mt-1 text-sm text-muted">-{discount}%</p>
        )}
      </div>
      <div>
        <p className="text-sm text-muted">{t('requestDetail.quantity')}</p>
        <p className="mt-1 text-ink">{item.quantity}</p>
      </div>
      <div>
        <p className="text-sm text-muted">{t('requestDetail.lineTotal')}</p>
        <p className="mt-1 font-semibold text-ink">{formatMoney(item.lineTotal)}</p>
      </div>
    </>
  );
}

export default function MyRequestDetailPage() {
  const { id } = useParams();
  const { t } = useTranslation();
  const query = useMyRequest(id);
  const request = query.data;

  usePageTitle(
    request
      ? t('requestDetail.title', { reference: request.reference })
      : t('myRequests.title'),
  );

  if (query.error?.response?.status === 404) {
    return (
      <EmptyState
        title={t('requestDetail.notFoundTitle')}
        text={t('requestDetail.notFoundText')}
        action={
          <Button as={Link} to="/account/requests">
            {t('requestDetail.back')}
          </Button>
        }
      />
    );
  }

  const skeleton = (
    <div className="space-y-8">
      <Skeleton className="h-6 w-40" />
      <Skeleton className="h-12 w-2/3" />
      <Skeleton className="h-64 w-full" />
      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    </div>
  );

  return (
    <main className="mx-auto max-w-7xl px-8 py-12">
      <QueryState query={query} skeleton={skeleton}>
        {(item) => (
          <>
            <Link to="/account/requests" className="text-sm text-ink underline hover:text-accent">
              {t('requestDetail.back')}
            </Link>
            <div className="mt-6 flex flex-col gap-5">
              <div className="flex flex-wrap items-center gap-4">
                <h1 className="font-display text-4xl font-bold text-ink">
                  {t('requestDetail.title', { reference: item.reference })}
                </h1>
                <StatusBadge status={item.status} />
              </div>
              <p className="text-sm text-muted">
                {t('requestDetail.sentOn', { date: formatDate(item.createdAt) })}
              </p>
              <p className="text-muted">{t(`requestDetail.status.${item.status}`)}</p>
            </div>

            <section className="mt-10">
              <h2 className="font-display text-2xl font-bold text-ink">
                {t('requestDetail.product')}
              </h2>
              <div className="mt-5 hidden overflow-x-auto rounded-3xl border border-line bg-white md:block">
                <table className="w-full text-left">
                  <thead className="border-b border-line bg-surface text-sm text-muted">
                    <tr>
                      <th className="px-6 py-4 font-medium">{t('requestDetail.product')}</th>
                      <th className="px-6 py-4 font-medium">{t('requestDetail.unitPrice')}</th>
                      <th className="px-6 py-4 font-medium">{t('requestDetail.discount')}</th>
                      <th className="px-6 py-4 font-medium">{t('requestDetail.quantity')}</th>
                      <th className="px-6 py-4 font-medium">{t('requestDetail.lineTotal')}</th>
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
                          <td className="px-6 py-5 text-muted">
                            {discount > 0 && `-${discount}%`}
                          </td>
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
                  {t('requestDetail.notes')}
                </h2>
                <p className="mt-4 whitespace-pre-line leading-7 text-muted">
                  {item.notes || t('requestDetail.noNotes')}
                </p>
              </section>
              <section className="rounded-3xl border border-line bg-surface p-6">
                <h2 className="font-display text-2xl font-bold text-ink">
                  {t('requestDetail.total')}
                </h2>
                <p className="mt-4 font-display text-3xl font-bold text-ink">
                  {formatMoney(item.estimatedTotal)}
                </p>
                <p className="mt-4 text-sm leading-6 text-muted">
                  {t('requestDetail.totalNote')}
                </p>
              </section>
            </div>
          </>
        )}
      </QueryState>
    </main>
  );
}
