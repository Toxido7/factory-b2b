import { prisma } from '../../config/prisma.js';

export const create = (data) => prisma.verificationToken.create({ data });
export const findByHash = (tokenHash) =>
  prisma.verificationToken.findUnique({ where: { tokenHash } });

// Marks the token as used AND verifies the user, together or not at all.
// Returns false if someone else already used the token a split second before us.
export const consumeEmailVerification = (tokenId, userId) =>
  prisma.$transaction(async (tx) => {
    const claimed = await tx.verificationToken.updateMany({
      where: { id: tokenId, usedAt: null },
      data: { usedAt: new Date() },
    });
    if (claimed.count === 0) return false;

    await tx.user.update({ where: { id: userId }, data: { emailVerified: true } });
    return true;
  });

// Cancels every unused token of this type for the user (used by "resend")
export const invalidateAllForUser = (userId, type) =>
  prisma.verificationToken.updateMany({
    where: { userId, type, usedAt: null },
    data: { usedAt: new Date() },
  });
