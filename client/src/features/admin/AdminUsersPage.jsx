import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import Button from '../../components/Button.jsx';
import ConfirmDialog from '../../components/ConfirmDialog.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import Input from '../../components/Input.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import Pagination from '../../components/Pagination.jsx';
import QueryState from '../../components/QueryState.jsx';
import Select from '../../components/Select.jsx';
import { useAuth } from '../auth/AuthContext.jsx';
import { formatDate } from '../../lib/format.js';
import { translateServerMessage } from '../../lib/formErrors.js';
import usePageTitle from '../../lib/usePageTitle.js';
import { useAdminUsers, useSetUserActive, useSetUserRole } from './adminApi.js';

const roles = ['USER', 'ADMIN'];
const statuses = ['active', 'disabled'];

function isValidRole(role) {
  return roles.includes(role);
}

function isValidStatus(status) {
  return statuses.includes(status);
}

function UserInfo({ user }) {
  const { t } = useTranslation();

  return (
    <div>
      <p className="font-medium text-ink">{user.fullName}</p>
      <p className="text-sm text-muted">{user.companyName || t('adminUsers.noCompany')}</p>
    </div>
  );
}

function UserDetails({ user }) {
  const { t } = useTranslation();

  return (
    <>
      <div>
        <p className="text-sm text-muted">{t('adminUsers.colName')}</p>
        <div className="mt-1">
          <UserInfo user={user} />
        </div>
      </div>
      <div>
        <p className="text-sm text-muted">{t('adminUsers.colEmail')}</p>
        <p className="mt-1 text-ink">{user.email}</p>
        <span className="mt-1 inline-flex rounded-full bg-surface px-2 py-1 text-xs text-muted">
          {user.emailVerified ? t('adminUsers.verified') : t('adminUsers.notVerified')}
        </span>
      </div>
      <div>
        <p className="text-sm text-muted">{t('adminUsers.colPhone')}</p>
        <p className="mt-1 text-ink">{user.phone || t('adminUsers.noPhone')}</p>
      </div>
      <div>
        <p className="text-sm text-muted">{t('adminUsers.colRole')}</p>
        <p className="mt-1 text-ink">{t(`adminUsers.role${user.role}`)}</p>
      </div>
      <div>
        <p className="text-sm text-muted">{t('adminUsers.colRequests')}</p>
        <p className="mt-1 text-ink">{user.requestCount}</p>
      </div>
      <div>
        <p className="text-sm text-muted">{t('adminUsers.colJoined')}</p>
        <p className="mt-1 text-ink">{formatDate(user.createdAt)}</p>
      </div>
      <div>
        <p className="text-sm text-muted">{t('adminUsers.colStatus')}</p>
        <span className="mt-1 inline-flex rounded-full bg-surface px-3 py-1 text-sm text-muted">
          {user.isActive ? t('adminUsers.statusActive') : t('adminUsers.statusDisabled')}
        </span>
      </div>
    </>
  );
}

export default function AdminUsersPage() {
  const { t } = useTranslation();
  const { user: currentUser } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('q') ?? '');
  const [dialog, setDialog] = useState(null);
  const [notice, setNotice] = useState(null);
  const [activeAction, setActiveAction] = useState(null);
  const actionRefs = useRef({});
  const requestedSearch = (searchParams.get('q') ?? '').trim().slice(0, 100);
  const requestedStatus = searchParams.get('status');
  const requestedRole = searchParams.get('role');
  const status = isValidStatus(requestedStatus) ? requestedStatus : '';
  const role = isValidRole(requestedRole) ? requestedRole : '';
  const pageValue = Number.parseInt(searchParams.get('page') ?? '1', 10);
  const page = Number.isNaN(pageValue) || pageValue < 1 ? 1 : pageValue;
  const query = useAdminUsers({
    page,
    q: requestedSearch,
    isActive: status ? (status === 'active' ? 'true' : 'false') : '',
    role,
  });
  const setActive = useSetUserActive();
  const setRole = useSetUserRole();

  usePageTitle(t('adminUsers.title'));

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

  function finishAction(id, action, error) {
    setDialog(null);
    setActiveAction(null);
    if (!error) {
      setNotice('done');
      window.setTimeout(() => actionRefs.current[`${id}:${action}`]?.focus(), 0);
      return;
    }

    const statusCode = error.response?.status;
    const serverError = error.response?.data?.error;
    setNotice({
      type: 'error',
      message: translateServerMessage(serverError?.message ?? t('common.genericError')),
    });
    if (statusCode === 404) query.refetch();
    window.setTimeout(() => actionRefs.current[`${id}:${action}`]?.focus(), 0);
  }

  function runAction(user, action) {
    setNotice(null);
    setActiveAction({ id: user.id, action });
    const onSettled = (data, error) => finishAction(user.id, action, error);

    if (action === 'disable' || action === 'enable') {
      setActive.mutate(
        { id: user.id, isActive: action === 'enable' },
        { onSettled },
      );
    } else {
      setRole.mutate(
        { id: user.id, role: action === 'makeAdmin' ? 'ADMIN' : 'USER' },
        { onSettled },
      );
    }
  }

  function requestAction(user, action) {
    if (action === 'enable') {
      runAction(user, action);
      return;
    }
    setDialog({ user, action });
  }

  function closeDialog() {
    const current = dialog;
    setDialog(null);
    if (current) {
      window.setTimeout(
        () => actionRefs.current[`${current.user.id}:${current.action}`]?.focus(),
        0,
      );
    }
  }

  const empty = (
    <EmptyState
      title={status || role || requestedSearch ? t('adminUsers.noResults') : t('adminUsers.emptyTitle')}
    />
  );

  return (
    <div>
      <PageHeader title="adminUsers.title" intro="adminUsers.intro" />
      <main className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
        <div className="mb-8 grid gap-4 md:grid-cols-[minmax(0,1fr)_auto_auto] md:items-end">
          <form onSubmit={submitSearch} className="flex items-end gap-3">
            <div className="min-w-0 flex-1">
              <Input
                id="admin-users-search"
                label={t('adminUsers.searchLabel')}
                value={search}
                maxLength={100}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
            <Button type="submit" className="shrink-0">{t('adminUsers.searchButton')}</Button>
          </form>
          <Select
            id="admin-users-status"
            label={t('adminUsers.statusLabel')}
            value={status}
            onChange={(event) => updateParams({ status: event.target.value })}
          >
            <option value="">{t('adminUsers.allStatuses')}</option>
            <option value="active">{t('adminUsers.active')}</option>
            <option value="disabled">{t('adminUsers.disabled')}</option>
          </Select>
          <Select
            id="admin-users-role"
            label={t('adminUsers.roleLabel')}
            value={role}
            onChange={(event) => updateParams({ role: event.target.value })}
          >
            <option value="">{t('adminUsers.allRoles')}</option>
            {roles.map((value) => (
              <option key={value} value={value}>{t(`adminUsers.role${value}`)}</option>
            ))}
          </Select>
        </div>
        {notice && (
          <p
            role={notice.type === 'error' ? 'alert' : 'status'}
            className={`mb-6 rounded-xl bg-surface p-3 text-sm ${notice.type === 'error' ? 'text-red-700' : 'text-muted'}`}
          >
            {notice.type === 'error' ? notice.message : t('adminUsers.done')}
          </p>
        )}
        <QueryState
          query={query}
          isEmpty={(result) => result.users.length === 0}
          empty={empty}
        >
          {(result) => (
            <>
              <p className="mb-4 text-sm text-muted">
                {t('adminUsers.count', { count: result.pagination.total })}
              </p>
              <div className="hidden overflow-x-auto rounded-3xl border border-line bg-white md:block">
                <table className="w-full text-left">
                  <thead className="border-b border-line bg-surface text-sm text-muted">
                    <tr>
                      <th className="px-6 py-4 font-medium">{t('adminUsers.colName')}</th>
                      <th className="px-6 py-4 font-medium">{t('adminUsers.colEmail')}</th>
                      <th className="px-6 py-4 font-medium">{t('adminUsers.colPhone')}</th>
                      <th className="px-6 py-4 font-medium">{t('adminUsers.colRole')}</th>
                      <th className="px-6 py-4 font-medium">{t('adminUsers.colRequests')}</th>
                      <th className="px-6 py-4 font-medium">{t('adminUsers.colJoined')}</th>
                      <th className="px-6 py-4 font-medium">{t('adminUsers.colStatus')}</th>
                      <th className="px-6 py-4 font-medium">{t('adminUsers.colActions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.users.map((item) => (
                      <tr key={item.id} className="border-b border-line last:border-0">
                        <td className="px-6 py-5"><UserInfo user={item} /></td>
                        <td className="px-6 py-5">
                          <p className="text-ink">{item.email}</p>
                          <span className="mt-1 inline-flex rounded-full bg-surface px-2 py-1 text-xs text-muted">
                            {item.emailVerified ? t('adminUsers.verified') : t('adminUsers.notVerified')}
                          </span>
                        </td>
                        <td className="px-6 py-5 text-ink">{item.phone || t('adminUsers.noPhone')}</td>
                        <td className="px-6 py-5 text-ink">{t(`adminUsers.role${item.role}`)}</td>
                        <td className="px-6 py-5 text-ink">{item.requestCount}</td>
                        <td className="px-6 py-5 text-ink">{formatDate(item.createdAt)}</td>
                        <td className="px-6 py-5">
                          <span className="inline-flex rounded-full bg-surface px-3 py-1 text-sm text-muted">
                            {item.isActive ? t('adminUsers.statusActive') : t('adminUsers.statusDisabled')}
                          </span>
                        </td>
                        <td className="px-6 py-5">{renderActions(item)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="space-y-4 md:hidden">
                {result.users.map((item) => (
                  <article key={item.id} className="rounded-3xl border border-line bg-white p-6">
                    <div className="grid gap-5 sm:grid-cols-2">
                      <UserDetails user={item} />
                    </div>
                    <div className="mt-5">{renderActions(item)}</div>
                  </article>
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
      {dialog && (
        <ConfirmDialog
          open
          onOpenChange={(open) => {
            if (!open) closeDialog();
          }}
          title={t(`adminUsers.confirm.${dialog.action}Title`)}
          text={t(`adminUsers.confirm.${dialog.action}Text`, { name: dialog.user.fullName })}
          confirmLabel={t('adminUsers.confirm.yes')}
          cancelLabel={t('admin.common.cancel')}
          loading={setActive.isPending || setRole.isPending}
          onConfirm={() => runAction(dialog.user, dialog.action)}
        />
      )}
    </div>
  );

  function renderActions(item) {
    const isCurrentUser = item.id === currentUser?.id;
    if (isCurrentUser) {
      return <span className="text-sm text-muted">{t('adminUsers.you')}</span>;
    }

    const disableAction = item.isActive ? 'disable' : 'enable';
    const roleAction = item.role === 'USER' ? 'makeAdmin' : 'removeAdmin';
    const rowPending = activeAction?.id === item.id && (setActive.isPending || setRole.isPending);

    return (
      <div className="flex flex-wrap gap-2">
        <Button
          ref={(element) => { actionRefs.current[`${item.id}:${disableAction}`] = element; }}
          type="button"
          variant="ghost"
          className="min-h-10 px-4 text-sm"
          aria-label={`${t(`adminUsers.${disableAction}`)} ${item.fullName}`}
          disabled={rowPending}
          onClick={() => requestAction(item, disableAction)}
        >
          {t(`adminUsers.${disableAction}`)}
        </Button>
        <Button
          ref={(element) => { actionRefs.current[`${item.id}:${roleAction}`] = element; }}
          type="button"
          variant="ghost"
          className="min-h-10 px-4 text-sm"
          aria-label={`${t(`adminUsers.${roleAction}`)} ${item.fullName}`}
          disabled={rowPending}
          onClick={() => requestAction(item, roleAction)}
        >
          {t(`adminUsers.${roleAction}`)}
        </Button>
      </div>
    );
  }
}
