import { prisma } from '../../config/prisma.js';

export const create = ({ userId, tokenHash, expiresAt, userAgent, ip }) =>
  prisma.refreshToken.create({ data: { userId, tokenHash, expiresAt, userAgent, ip } });
export const findByHash = (tokenHash) =>
  prisma.refreshToken.findUnique({ where: { tokenHash }, include: { user: true } });

export const revokeAllForUser = (userId) =>
  prisma.refreshToken.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });

// Cancel the old token and create the new one, together or not at all.
// Returns null if someone else already cancelled the old one.
export const rotate = (oldId, newRecord) =>
  prisma.$transaction(async (tx) => {
    const claimed = await tx.refreshToken.updateMany({
      where: { id: oldId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    if (claimed.count !== 1) return null;

    return tx.refreshToken.create({ data: newRecord });
  });
