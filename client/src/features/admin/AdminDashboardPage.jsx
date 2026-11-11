import { Link, useSearchParams } from 'react-router';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ClipboardList,
  Percent,
  TrendingUp,
  Users,
} from 'lucide-react';
import { motion } from 'motion/react';
import PageHeader from '../../components/PageHeader.jsx';
import QueryState from '../../components/QueryState.jsx';
import Select from '../../components/Select.jsx';
import Skeleton from '../../components/Skeleton.jsx';
import CountUp from '../../components/motion/CountUp.jsx';
import Reveal from '../../components/motion/Reveal.jsx';
import { Stagger, StaggerItem } from '../../components/motion/Stagger.jsx';
import { formatDate, formatMoney } from '../../lib/format.js';
import { EASE, DURATION } from '../../lib/motion.js';
import { RANGE_OPTIONS, rangeFromDays } from '../../lib/dateRange.js';
import usePageTitle from '../../lib/usePageTitle.js';
import {
  useAdminOverview,
  useAdminRequestsOverTime,
  useAdminTopCustomers,
  useAdminTopProducts,
} from './adminApi.js';
import RequestsChart from './RequestsChart.jsx';

const statuses = ['PENDING', 'CONTACTED', 'CONFIRMED', 'REJECTED', 'CANCELLED'];
const statusBarClasses = {
  PENDING: 'bg-accent',
  CONTACTED: 'bg-gold-light',
  CONFIRMED: 'bg-ink',
  REJECTED: 'bg-muted',
  CANCELLED: 'border border-line bg-surface',
};

function BlockSkeleton({ className = 'h-48' }) {
  return <Skeleton className={`w-full ${className}`} />;
}

function RankingList({ items, type }) {
  const { t } = useTranslation();
  const firstValue = items[0]?.[type === 'products' ? 'quantity' : 'requestCount'] ?? 0;

  if (!items.length) return <p className="mt-6 text-muted">{t('adminDashboard.emptyList')}</p>;

  return (
    <div className="mt-6 space-y-5">
      {items.map((item, index) => {
        const value = type === 'products' ? item.quantity : item.requestCount;
        return (
          <div key={type === 'products' ? item.productId : item.userId}>
            <div className="flex items-start gap-3">
              <span className="font-display text-xl font-bold text-accent">{index + 1}</span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-ink">
                  {type === 'products' ? item.name : item.fullName}
                </p>
                <p className="text-sm text-muted">
                  {type === 'products'
                    ? item.sku
                    : `${item.companyName || t('adminDashboard.noCompany')} · ${item.email}`}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted">
                  {t(type === 'products' ? 'adminDashboard.units' : 'adminDashboard.requestsCount', { count: value })}
                </p>
                <p className="font-semibold text-ink">
                  {formatMoney(type === 'products' ? item.estimatedValue : item.estimatedTotal)}
                </p>
              </div>
            </div>
            <motion.div
              className="mt-3 h-1 origin-left rounded-full bg-ink"
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: firstValue ? value / firstValue : 0 }}
              viewport={{ once: true }}
              transition={{ duration: DURATION, ease: EASE }}
            />
          </div>
        );
      })}
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <BlockSkeleton className="h-56" />
      <BlockSkeleton className="h-48" />
    </div>
  );
}

export default function AdminDashboardPage() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedRange = Number.parseInt(searchParams.get('range') ?? '30', 10);
  const days = RANGE_OPTIONS.includes(requestedRange) ? requestedRange : 30;
  const range = useMemo(() => rangeFromDays(days), [days]);
  const overviewQuery = useAdminOverview(range);
  const chartQuery = useAdminRequestsOverTime(range);
  const productsQuery = useAdminTopProducts(range);
  const customersQuery = useAdminTopCustomers(range);
  const overview = overviewQuery.data;

  usePageTitle(t('adminDashboard.title'));

  function setRange(value) {
    const next = new URLSearchParams(searchParams);
    if (value === 30) next.delete('range');
    else next.set('range', value);
    setSearchParams(next);
  }

  const noActivity = <p className="mt-6 text-muted">{t('adminDashboard.noActivity')}</p>;
  const emptyList = <p className="mt-6 text-muted">{t('adminDashboard.emptyList')}</p>;
  const chartEmpty = (
    <section className="rounded-3xl bg-ink p-6 text-white lg:p-8">
      <h2 className="font-display text-2xl font-bold">{t('adminDashboard.chartTitle')}</h2>
      <p className="mt-6 text-white/70">{t('adminDashboard.noActivity')}</p>
    </section>
  );

  return (
    <div>
      <PageHeader title="adminDashboard.title" intro="adminDashboard.intro" />
      <main className="mx-auto max-w-7xl space-y-8 px-6 py-10 lg:px-8">
        <div className="max-w-xs">
          <Select
            id="admin-dashboard-period"
            label={t('adminDashboard.periodLabel')}
            value={days}
            onChange={(event) => setRange(Number(event.target.value))}
          >
            {RANGE_OPTIONS.map((value) => (
              <option key={value} value={value}>{t('adminDashboard.days', { count: value })}</option>
            ))}
          </Select>
        </div>

        <QueryState query={overviewQuery} skeleton={<DashboardSkeleton />}>
          {(data) => (
            <div className="space-y-6">
              <Stagger className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                <StaggerItem className="rounded-3xl bg-ink p-5 text-white">
                  <ClipboardList aria-hidden="true" className="h-6 w-6 text-accent" />
                  <p className="mt-5 text-sm text-white/70">{t('adminDashboard.kpiPending')}</p>
                  <p className="mt-1 text-3xl font-bold"><CountUp value={data.byStatus.PENDING} /></p>
                  <p className="mt-2 text-xs text-white/60">{t('adminDashboard.kpiPendingHint')}</p>
                  <Link className="mt-4 inline-block text-sm text-white underline hover:text-accent" to="/admin/requests?status=PENDING">
                    {t('adminDashboard.seeList')}
                  </Link>
                </StaggerItem>
                <StaggerItem className="rounded-3xl border border-line bg-white p-5">
                  <TrendingUp aria-hidden="true" className="h-6 w-6 text-ink" />
                  <p className="mt-5 text-sm text-muted">{t('adminDashboard.kpiTotal')}</p>
                  <p className="mt-1 text-3xl font-bold text-ink"><CountUp value={data.totalRequests} /></p>
                  <p className="mt-2 text-xs text-muted">{t('adminDashboard.kpiTotalHint')}</p>
                </StaggerItem>
                <StaggerItem className="rounded-3xl border border-line bg-white p-5">
                  <Percent aria-hidden="true" className="h-6 w-6 text-ink" />
                  <p className="mt-5 text-sm text-muted">{t('adminDashboard.kpiConversion')}</p>
                  <p className="mt-1 text-3xl font-bold text-ink"><CountUp value={data.conversionRate} decimals={1} suffix=" %" /></p>
                  <p className="mt-2 text-xs text-muted">{t('adminDashboard.kpiConversionHint')}</p>
                </StaggerItem>
                <StaggerItem className="rounded-3xl border border-line bg-white p-5">
                  <Users aria-hidden="true" className="h-6 w-6 text-ink" />
                  <p className="mt-5 text-sm text-muted">{t('adminDashboard.kpiCustomers')}</p>
                  <p className="mt-1 text-3xl font-bold text-ink"><CountUp value={data.newCustomers} /></p>
                  <p className="mt-2 text-xs text-muted">{t('adminDashboard.kpiCustomersHint')}</p>
                </StaggerItem>
              </Stagger>
              <section className="rounded-3xl border border-line bg-white p-6">
                <h2 className="font-display text-2xl font-bold text-ink">{t('adminDashboard.statusTitle')}</h2>
                {data.totalRequests === 0 ? (
                  noActivity
                ) : (
                  <>
                    <div className="mt-6 flex h-5 overflow-hidden rounded-full bg-surface">
                      {statuses.map((status) =>
                        data.byStatus[status] > 0 ? (
                          <motion.div
                            key={status}
                            className={statusBarClasses[status]}
                            style={{ width: `${(data.byStatus[status] / data.totalRequests) * 100}%` }}
                            initial={{ scaleX: 0 }}
                            whileInView={{ scaleX: 1 }}
                            viewport={{ once: true }}
                            transition={{ duration: DURATION, ease: EASE }}
                          />
                        ) : null,
                      )}
                    </div>
                    <div className="mt-5 flex flex-wrap gap-x-6 gap-y-3">
                      {statuses.map((status) => (
                        <div key={status} className="flex items-center gap-2 text-sm text-muted">
                          <span aria-hidden="true" className={`h-3 w-3 rounded-full ${statusBarClasses[status]}`} />
                          <span>{t(`requestStatus.${status}`)}</span>
                          <span className="font-semibold text-ink">{data.byStatus[status]}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </section>
            </div>
          )}
        </QueryState>

        <QueryState query={chartQuery} skeleton={<BlockSkeleton className="h-[390px]" />} isEmpty={(data) => data.series.every((point) => point.count === 0)} empty={chartEmpty}>
          {(data) => (
            <section className="rounded-3xl bg-ink p-6 text-white lg:p-8">
              <h2 className="font-display text-2xl font-bold">{t('adminDashboard.chartTitle')}</h2>
              <div className="mt-6">
                <RequestsChart series={data.series} from={data.range.from} to={data.range.to} />
              </div>
            </section>
          )}
        </QueryState>

        <div className="grid gap-6 lg:grid-cols-2">
          <QueryState query={productsQuery} skeleton={<BlockSkeleton className="h-80" />} isEmpty={(data) => data.products.length === 0} empty={emptyList}>
            {(data) => (
              <Reveal className="rounded-3xl border border-line bg-white p-6">
                <h2 className="font-display text-2xl font-bold text-ink">{t('adminDashboard.topProducts')}</h2>
                <p className="mt-2 text-sm text-muted">{t('adminDashboard.topProductsHint')}</p>
                <RankingList items={data.products} type="products" />
              </Reveal>
            )}
          </QueryState>
          <QueryState query={customersQuery} skeleton={<BlockSkeleton className="h-80" />} isEmpty={(data) => data.customers.length === 0} empty={emptyList}>
            {(data) => (
              <Reveal className="rounded-3xl border border-line bg-white p-6">
                <h2 className="font-display text-2xl font-bold text-ink">{t('adminDashboard.topCustomers')}</h2>
                <p className="mt-2 text-sm text-muted">{t('adminDashboard.topCustomersHint')}</p>
                <RankingList items={data.customers} type="customers" />
              </Reveal>
            )}
          </QueryState>
        </div>
      </main>
    </div>
  );
}
