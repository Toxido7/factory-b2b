import { prisma } from '../../config/prisma.js';

export const create = ({ userId, tokenHash, expiresAt, userAgent, ip }) =>
  prisma.refreshToken.create({ data: { userId, tokenHash, expiresAt, userAgent, ip } });
