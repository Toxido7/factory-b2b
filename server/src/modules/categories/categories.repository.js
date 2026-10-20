import { prisma } from '../../config/prisma.js';

export const create = (data) => prisma.category.create({ data });

export const findById = (id) =>
  prisma.category.findUnique({
    where: { id },
    include: { _count: { select: { children: true } } },
  });

export const listActive = () =>
  prisma.category.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } });

export const listAll = () => prisma.category.findMany({ orderBy: { name: 'asc' } });

export const update = (id, data) => prisma.category.update({ where: { id }, data });
