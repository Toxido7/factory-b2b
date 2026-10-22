import * as statsRepository from './stats.repository.js';
import { resolveRange, DAY } from '../../utils/dateRange.js';

const STATUSES = ['PENDING', 'CONTACTED', 'CONFIRMED', 'REJECTED', 'CANCELLED'];
const publicRange = ({ from, to }) => ({ from, to });

export const getOverview = async (query) => {
  const range = resolveRange(query);
  const [rows, newCustomers] = await Promise.all([
    statsRepository.countByStatus(range),
    statsRepository.countNewCustomers(range),
  ]);

  const byStatus = Object.fromEntries(STATUSES.map((status) => [status, 0]));
  for (const row of rows) byStatus[row.status] = row._count.id;

  const totalRequests = Object.values(byStatus).reduce((sum, n) => sum + n, 0);
  const conversionRate =
    totalRequests === 0 ? 0 : Math.round((byStatus.CONFIRMED / totalRequests) * 1000) / 10;

  return { range: publicRange(range), totalRequests, byStatus, conversionRate, newCustomers };
};

export const getRequestsOverTime = async ({ interval, ...query }) => {
  const range = resolveRange(query);
  const rows = await statsRepository.findRequestDates(range);

  const keyOf = (date) => date.toISOString().slice(0, interval === 'month' ? 7 : 10);
  const counts = new Map();
  for (const { createdAt } of rows) {
    const key = keyOf(createdAt);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  // Walk every day of the range so empty periods appear with count 0
  const series = [];
  const seen = new Set();
  for (let t = range.start.getTime(); t < range.end.getTime(); t += DAY) {
    const key = keyOf(new Date(t));
    if (seen.has(key)) continue;
    seen.add(key);
    series.push({ period: key, count: counts.get(key) ?? 0 });
  }

  return { range: publicRange(range), interval, series };
};

export const getTopProducts = async ({ limit, ...query }) => {
  const range = resolveRange(query);
  const rows = await statsRepository.topProducts(range, limit);
  const found = await statsRepository.findProductsByIds(rows.map((row) => row.productId));
  const byId = new Map(found.map((product) => [product.id, product]));

  return {
    range: publicRange(range),
    products: rows.map((row) => ({
      productId: row.productId,
      name: byId.get(row.productId).name,
      sku: byId.get(row.productId).sku,
      quantity: row._sum.quantity,
      estimatedValue: row._sum.lineTotal.toFixed(2),
      requestCount: row._count.id,
    })),
  };
};

export const getTopCustomers = async ({ limit, ...query }) => {
  const range = resolveRange(query);
  const rows = await statsRepository.topCustomers(range, limit);
  const found = await statsRepository.findUsersByIds(rows.map((row) => row.userId));
  const byId = new Map(found.map((user) => [user.id, user]));

  return {
    range: publicRange(range),
    customers: rows.map((row) => {
      const user = byId.get(row.userId);
      return {
        userId: row.userId,
        fullName: user.fullName,
        email: user.email,
        companyName: user.companyName,
        requestCount: row._count.id,
        estimatedTotal: row._sum.estimatedTotal.toFixed(2),
      };
    }),
  };
};
