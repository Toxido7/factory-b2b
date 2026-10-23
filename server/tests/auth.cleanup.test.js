import { describe, it, expect, beforeEach } from 'vitest';
import { randomUUID } from 'node:crypto';
import { prisma } from '../src/config/prisma.js';
import { resetDb } from './helpers/db.js';
import { cleanupExpiredTokens } from '../src/modules/auth/auth.service.js';

const DAY = 24 * 60 * 60 * 1000;
const daysFromNow = (n) => new Date(Date.now() + n * DAY);

let user;
beforeEach(async () => {
  await resetDb();
  user = await prisma.user.create({
    data: { email: 'tokens@example.com', passwordHash: 'not-a-real-hash', fullName: 'Token User' },
  });
});

const makeRefresh = (expiresAt, extra = {}) =>
  prisma.refreshToken.create({
    data: { userId: user.id, tokenHash: randomUUID(), expiresAt, ...extra },
  });

const makeVerification = (expiresAt) =>
  prisma.verificationToken.create({
    data: { userId: user.id, type: 'EMAIL_VERIFY', tokenHash: randomUUID(), expiresAt },
  });

describe('cleanupExpiredTokens', () => {
  it('deletes refresh tokens expired for more than 7 days and keeps the others', async () => {
    await makeRefresh(daysFromNow(-10));
    const recent = await makeRefresh(daysFromNow(-2));
    const active = await makeRefresh(daysFromNow(5));

    const result = await cleanupExpiredTokens({ olderThanDays: 7 });

    expect(result.refreshTokens).toBe(1);
    const left = await prisma.refreshToken.findMany({ select: { id: true } });
    expect(left.map((t) => t.id).sort()).toEqual([recent.id, active.id].sort());
  });

  it('keeps revoked tokens that are not expired yet (theft alarm)', async () => {
    await makeRefresh(daysFromNow(5), { revokedAt: new Date() });

    const result = await cleanupExpiredTokens();

    expect(result.refreshTokens).toBe(0);
    expect(await prisma.refreshToken.count()).toBe(1);
  });

  it('deletes old expired verification tokens and keeps active ones', async () => {
    await makeVerification(daysFromNow(-10));
    await makeVerification(daysFromNow(1));

    const result = await cleanupExpiredTokens({ olderThanDays: 7 });

    expect(result.verificationTokens).toBe(1);
    expect(await prisma.verificationToken.count()).toBe(1);
  });

  it('accepts 0 days: everything already expired goes', async () => {
    await makeRefresh(daysFromNow(-2));
    await makeRefresh(daysFromNow(5));

    const result = await cleanupExpiredTokens({ olderThanDays: 0 });

    expect(result.refreshTokens).toBe(1);
    expect(await prisma.refreshToken.count()).toBe(1);
  });
});
