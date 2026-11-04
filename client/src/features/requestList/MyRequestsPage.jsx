import { Link, useSearchParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import Button from '../../components/Button.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import Pagination from '../../components/Pagination.jsx';
import QueryState from '../../components/QueryState.jsx';
import Skeleton from '../../components/Skeleton.jsx';
import StatusBadge from '../../components/StatusBadge.jsx';
import { formatDate, formatMoney } from '../../lib/format.js';
import usePageTitle from '../../lib/usePageTitle.js';
import { useMyRequests } from './requestsApi.js';

const statuses = ['PENDING', 'CONTACTED', 'CONFIRMED', 'REJECTED', 'CANCELLED'];

function isValidStatus(status) {
  return statuses.includes(status);
}

function RequestInfo({ request }) {
  const { t } = useTranslation();

  return (
    <>
      <div>
        <p className="text-sm text-muted">{t('myRequests.reference')}</p>
        <p className="mt-1 font-semibold text-ink">{request.reference}</p>
      </div>
      <div>
        <p className="text-sm text-muted">{t('myRequests.date')}</p>
        <p className="mt-1 text-ink">{formatDate(request.createdAt)}</p>
      </div>
      <div>
        <p className="text-sm text-muted">{t('myRequests.items')}</p>
        <p className="mt-1 text-ink">{request.itemCount}</p>
      </div>
      <div>
        <p className="text-sm text-muted">{t('myRequests.total')}</p>
        <p className="mt-1 font-semibold text-ink">{formatMoney(request.estimatedTotal)}</p>
      </div>
      <div>
        <p className="text-sm text-muted">{t('myRequests.status')}</p>
        <div className="mt-1">
          <StatusBadge status={request.status} />
        </div>
      </div>
    </>
  );
}

export default function MyRequestsPage() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedStatus = searchParams.get('status');
  const status = isValidStatus(requestedStatus) ? requestedStatus : '';
  const pageValue = Number.parseInt(searchParams.get('page') ?? '1', 10);
  const page = Number.isNaN(pageValue) || pageValue < 1 ? 1 : pageValue;
  const query = useMyRequests({ page, status });
  const data = query.data;

  usePageTitle(t('myRequests.title'));

  function updateParams(partial) {
    const next = new URLSearchParams(searchParams);
    Object.entries(partial).forEach(([key, value]) => {
      if (!value) next.delete(key);
      else next.set(key, value);
    });
    if (!Object.prototype.hasOwnProperty.call(partial, 'page')) next.delete('page');
    setSearchParams(next);
  }

  const empty = (
    <EmptyState
      title={t('myRequests.emptyTitle')}
      text={status ? t('myRequests.emptyFiltered') : t('myRequests.emptyText')}
      action={
        <Button as={Link} to="/categories">
          {t('myRequests.browse')}
        </Button>
      }
    />
  );

  const skeleton = (
    <div className="space-y-4">
      {Array.from({ length: 4 }, (_, index) => (
        <Skeleton key={index} className="h-28 w-full" />
      ))}
    </div>
  );

  return (
    <div>
      <PageHeader title="myRequests.title" intro="myRequests.intro" />
      <main className="mx-auto max-w-7xl px-8 py-12">
        <div className="mb-8 max-w-xs">
          <label htmlFor="request-status" className="mb-2 block text-sm font-medium text-ink">
            {t('myRequests.filterLabel')}
          </label>
          <select
            id="request-status"
            className="min-h-12 w-full rounded-xl border border-line bg-surface px-4 text-ink outline-none focus:border-ink"
            value={status}
            onChange={(event) => updateParams({ status: event.target.value })}
          >
            <option value="">{t('myRequests.filterAll')}</option>
            {statuses.map((value) => (
              <option key={value} value={value}>
                {t(`requestStatus.${value}`)}
              </option>
            ))}
          </select>
        </div>
        <QueryState
          query={query}
          isEmpty={(result) => result.requests.length === 0}
          skeleton={skeleton}
          empty={empty}
        >
          {(result) => (
            <>
              <div className="hidden overflow-x-auto rounded-3xl border border-line bg-white md:block">
                <table className="w-full text-left">
                  <thead className="border-b border-line bg-surface text-sm text-muted">
                    <tr>
                      <th className="px-6 py-4 font-medium">{t('myRequests.reference')}</th>
                      <th className="px-6 py-4 font-medium">{t('myRequests.date')}</th>
                      <th className="px-6 py-4 font-medium">{t('myRequests.items')}</th>
                      <th className="px-6 py-4 font-medium">{t('myRequests.total')}</th>
                      <th className="px-6 py-4 font-medium">{t('myRequests.status')}</th>
                      <th className="px-6 py-4"><span className="sr-only">{t('myRequests.view')}</span></th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.requests.map((request) => (
                      <tr key={request.id} className="border-b border-line last:border-0">
                        <td className="px-6 py-5 font-semibold text-ink">{request.reference}</td>
                        <td className="px-6 py-5 text-ink">{formatDate(request.createdAt)}</td>
                        <td className="px-6 py-5 text-ink">{request.itemCount}</td>
                        <td className="px-6 py-5 font-semibold text-ink">{formatMoney(request.estimatedTotal)}</td>
                        <td className="px-6 py-5"><StatusBadge status={request.status} /></td>
                        <td className="px-6 py-5 text-right">
                          <Link to={`/account/requests/${request.id}`} className="text-sm font-medium text-ink underline hover:text-accent">
                            {t('myRequests.view')}
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="space-y-4 md:hidden">
                {result.requests.map((request) => (
                  <Link
                    key={request.id}
                    to={`/account/requests/${request.id}`}
                    className="block rounded-3xl border border-line bg-white p-6"
                  >
                    <div className="grid gap-5 sm:grid-cols-2">
                      <RequestInfo request={request} />
                    </div>
                    <p className="mt-5 text-sm font-medium text-ink underline">{t('myRequests.view')}</p>
                  </Link>
                ))}
              </div>
              <Pagination
                page={result.pagination.page}
                totalPages={result.pagination.totalPages}
                onChange={(nextPage) => updateParams({ page: nextPage })}
              />
            </>
          )}
        </QueryState>
      </main>
    </div>
  );
}
