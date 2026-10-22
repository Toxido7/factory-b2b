import { prisma } from '../../config/prisma.js';
import { parseReference } from '../../utils/reference.js';
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
const adminWhere = ({ status, q }) => {
  const where = {};
  if (status) where.status = status;
  if (q) {
    const number = parseReference(q);
    where.OR =
      number !== null
        ? [{ number }]
        : [
            { customerName: { contains: q, mode: 'insensitive' } },
            { customerEmail: { contains: q, mode: 'insensitive' } },
            { customerCompany: { contains: q, mode: 'insensitive' } },
          ];
  }
  return where;
};

export const listAll = async ({ page, limit, status, q }) => {
  const where = adminWhere({ status, q });

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

export const findDetail = (id) =>
  prisma.orderRequest.findUnique({
    where: { id },
    include: {
      items: { orderBy: { productName: 'asc' } },
      handledBy: { select: { id: true, fullName: true } },
    },
  });

// returns how many rows changed (0 = someone else changed it first)
export const changeStatus = async (id, from, to, adminId) => {
  const { count } = await prisma.orderRequest.updateMany({
    where: { id, status: from },
    data: { status: to, handledById: adminId },
  });
  return count;
};
