import { prisma } from '../../config/prisma.js';

export const create = (data) => prisma.orderRequest.create({ data, include: { items: true } });
