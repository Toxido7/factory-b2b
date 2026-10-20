import { prisma } from '../../config/prisma.js';

export const create = (data) => prisma.verificationToken.create({ data });
