import { prisma } from '../../config/prisma.js';

export const create = (data) => prisma.orderRequest.create({ data, include: { items: true } });
export const markEmailSent = (id) =>
  prisma.orderRequest.update({ where: { id }, data: { emailSentAt: new Date() } });

export const findUnsent = ({ olderThan, limit }) =>
  prisma.orderRequest.findMany({
    where: { emailSentAt: null, createdAt: { lte: olderThan } },
    include: { items: true },
    orderBy: { createdAt: 'asc' },
    take: limit,
  });
