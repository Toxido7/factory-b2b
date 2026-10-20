import { prisma } from '../../config/prisma.js';

const withCategory = { category: { select: { id: true, name: true, slug: true } } };

export const create = (data) => prisma.product.create({ data, include: withCategory });

export const findById = (id) => prisma.product.findUnique({ where: { id }, include: withCategory });

export const listAll = () =>
  prisma.product.findMany({ orderBy: { createdAt: 'desc' }, include: withCategory });

export const update = (id, data) =>
  prisma.product.update({ where: { id }, data, include: withCategory });
