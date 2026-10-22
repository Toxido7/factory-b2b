import { prisma } from '../../config/prisma.js';

const DEAD_STATUSES = ['REJECTED', 'CANCELLED'];
const rangeWhere = ({ start, end }) => ({ createdAt: { gte: start, lt: end } });

export const countByStatus = (range) =>
  prisma.orderRequest.groupBy({
    by: ['status'],
    where: rangeWhere(range),
    _count: { id: true },
  });

export const countNewCustomers = (range) =>
  prisma.user.count({ where: { role: 'USER', ...rangeWhere(range) } });

export const findRequestDates = (range) =>
  prisma.orderRequest.findMany({ where: rangeWhere(range), select: { createdAt: true } });

export const topProducts = (range, limit) =>
  prisma.requestItem.groupBy({
    by: ['productId'],
    where: { request: { ...rangeWhere(range), status: { notIn: DEAD_STATUSES } } },
    _count: { id: true },
    _sum: { quantity: true, lineTotal: true },
    orderBy: [{ _sum: { quantity: 'desc' } }, { productId: 'asc' }],
    take: limit,
  });

export const topCustomers = (range, limit) =>
  prisma.orderRequest.groupBy({
    by: ['userId'],
    where: { ...rangeWhere(range), status: { notIn: DEAD_STATUSES } },
    _count: { id: true },
    _sum: { estimatedTotal: true },
    orderBy: [{ _count: { id: 'desc' } }, { userId: 'asc' }],
    take: limit,
  });

export const findProductsByIds = (ids) =>
  prisma.product.findMany({
    where: { id: { in: ids } },
    select: { id: true, name: true, sku: true },
  });

export const findUsersByIds = (ids) =>
  prisma.user.findMany({
    where: { id: { in: ids } },
    select: { id: true, fullName: true, email: true, companyName: true },
  });
