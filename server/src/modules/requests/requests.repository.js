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
export const listByUser = async (userId, { page, limit, status }) => {
  const where = { userId, ...(status && { status }) };

  const [requests, total] = await prisma.$transaction([
    prisma.orderRequest.findMany({
      where,
      include: { _count: { select: { items: true } } },
      orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.orderRequest.count({ where }),
  ]);

  return { requests, total };
};

// the ownership check lives here: id AND userId
export const findOneByUser = (id, userId) =>
  prisma.orderRequest.findFirst({
    where: { id, userId },
    include: { items: { orderBy: { productName: 'asc' } } },
  });
