import { Link, useSearchParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';
import Button from '../../components/Button.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import Input from '../../components/Input.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import Pagination from '../../components/Pagination.jsx';
import QueryState from '../../components/QueryState.jsx';
import Select from '../../components/Select.jsx';
import StatusBadge from '../../components/StatusBadge.jsx';
import { formatDate, formatMoney } from '../../lib/format.js';
import usePageTitle from '../../lib/usePageTitle.js';
import { useAdminRequests } from './adminApi.js';

const statuses = ['PENDING', 'CONTACTED', 'CONFIRMED', 'REJECTED', 'CANCELLED'];

function isValidStatus(status) {
  return statuses.includes(status);
}

function CustomerInfo({ request }) {
  const { t } = useTranslation();

  return (
    <div>
      <p className="font-medium text-ink">{request.customerName}</p>
      <p className="text-sm text-muted">{request.customerCompany || t('adminRequests.noCompany')}</p>
      <p className="text-sm text-muted">{request.customerEmail}</p>
    </div>
  );
}

function RequestInfo({ request }) {
  const { t } = useTranslation();

  return (
    <>
      <div>
        <p className="text-sm text-muted">{t('adminRequests.colReference')}</p>
        <p className="mt-1 font-semibold text-ink">{request.reference}</p>
      </div>
      <div>
        <p className="text-sm text-muted">{t('adminRequests.colDate')}</p>
        <p className="mt-1 text-ink">{formatDate(request.createdAt)}</p>
      </div>
      <div>
        <p className="text-sm text-muted">{t('adminRequests.colCustomer')}</p>
        <div className="mt-1">
          <CustomerInfo request={request} />
        </div>
      </div>
      <div>
        <p className="text-sm text-muted">{t('adminRequests.colItems')}</p>
        <p className="mt-1 text-ink">{request.itemCount}</p>
      </div>
      <div>
        <p className="text-sm text-muted">{t('adminRequests.colTotal')}</p>
        <p className="mt-1 font-semibold text-ink">{formatMoney(request.estimatedTotal)}</p>
      </div>
      <div>
        <p className="text-sm text-muted">{t('adminRequests.colStatus')}</p>
        <div className="mt-1">
          <StatusBadge status={request.status} />
        </div>
      </div>
    </>
  );
}

export default function AdminRequestsPage() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('q') ?? '');
  const requestedStatus = searchParams.get('status');
  const status = isValidStatus(requestedStatus) ? requestedStatus : '';
  const requestedSearch = (searchParams.get('q') ?? '').trim().slice(0, 100);
  const pageValue = Number.parseInt(searchParams.get('page') ?? '1', 10);
  const page = Number.isNaN(pageValue) || pageValue < 1 ? 1 : pageValue;
  const query = useAdminRequests({ page, status, q: requestedSearch });

  usePageTitle(t('adminRequests.title'));

  useEffect(() => {
    setSearch(requestedSearch);
  }, [requestedSearch]);

  function updateParams(partial) {
    const next = new URLSearchParams(searchParams);
    Object.entries(partial).forEach(([key, value]) => {
      if (!value) next.delete(key);
      else next.set(key, value);
    });
    if (!Object.prototype.hasOwnProperty.call(partial, 'page')) next.delete('page');
    setSearchParams(next);
  }

  function submitSearch(event) {
    event.preventDefault();
    updateParams({ q: search.trim().slice(0, 100) });
  }

  const empty = (
    <EmptyState
      title={status || requestedSearch ? t('adminRequests.noResults') : t('adminRequests.emptyTitle')}
      text={status || requestedSearch ? undefined : t('adminRequests.emptyText')}
    />
  );

  return (
    <div>
      <PageHeader title="adminRequests.title" intro="adminRequests.intro" />
      <main className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
        <div className="mb-8 grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
          <form onSubmit={submitSearch} className="flex items-end gap-3">
            <div className="min-w-0 flex-1">
              <Input
                id="admin-requests-search"
                label={t('adminRequests.searchLabel')}
                value={search}
                maxLength={100}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
            <Button type="submit" className="shrink-0">{t('adminRequests.searchButton')}</Button>
          </form>
          <Select
            id="admin-requests-status"
            label={t('adminRequests.statusLabel')}
            value={status}
            onChange={(event) => updateParams({ status: event.target.value })}
          >
            <option value="">{t('adminRequests.allStatuses')}</option>
            {statuses.map((value) => (
              <option key={value} value={value}>{t(`requestStatus.${value}`)}</option>
            ))}
          </Select>
        </div>
        <QueryState
          query={query}
          isEmpty={(result) => result.requests.length === 0}
          empty={empty}
        >
          {(result) => (
            <>
              <p className="mb-4 text-sm text-muted">
                {t('adminRequests.count', { count: result.pagination.total })}
              </p>
              <div className="hidden overflow-x-auto rounded-3xl border border-line bg-white md:block">
                <table className="w-full text-left">
                  <thead className="border-b border-line bg-surface text-sm text-muted">
                    <tr>
                      <th className="px-6 py-4 font-medium">{t('adminRequests.colReference')}</th>
                      <th className="px-6 py-4 font-medium">{t('adminRequests.colDate')}</th>
                      <th className="px-6 py-4 font-medium">{t('adminRequests.colCustomer')}</th>
                      <th className="px-6 py-4 font-medium">{t('adminRequests.colItems')}</th>
                      <th className="px-6 py-4 font-medium">{t('adminRequests.colTotal')}</th>
                      <th className="px-6 py-4 font-medium">{t('adminRequests.colStatus')}</th>
                      <th className="px-6 py-4 font-medium">{t('adminRequests.colActions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.requests.map((request) => (
                      <tr key={request.id} className="border-b border-line last:border-0">
                        <td className="px-6 py-5 font-semibold text-ink">{request.reference}</td>
                        <td className="px-6 py-5 text-ink">{formatDate(request.createdAt)}</td>
                        <td className="px-6 py-5"><CustomerInfo request={request} /></td>
                        <td className="px-6 py-5 text-ink">{request.itemCount}</td>
                        <td className="px-6 py-5 font-semibold text-ink">{formatMoney(request.estimatedTotal)}</td>
                        <td className="px-6 py-5"><StatusBadge status={request.status} /></td>
                        <td className="px-6 py-5 text-right">
                          <Link
                            to={`/admin/requests/${request.id}`}
                            aria-label={`${t('adminRequests.view')} ${request.reference}`}
                            className="text-sm font-medium text-ink underline hover:text-accent"
                          >
                            {t('adminRequests.view')}
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
                    to={`/admin/requests/${request.id}`}
                    aria-label={`${t('adminRequests.view')} ${request.reference}`}
                    className="block rounded-3xl border border-line bg-white p-6"
                  >
                    <div className="grid gap-5 sm:grid-cols-2">
                      <RequestInfo request={request} />
                    </div>
                    <p className="mt-5 text-sm font-medium text-ink underline">{t('adminRequests.view')}</p>
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
