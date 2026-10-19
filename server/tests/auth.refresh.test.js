import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import { prisma } from '../src/config/prisma.js';
import { verifyAccessToken, hashToken } from '../src/utils/tokens.js';
import { resetDb } from './helpers/db.js';
import { getRefreshCookie, getCookiePair, getCookieValue } from './helpers/auth.js';

const credentials = { email: 'ahmed@test.com', password: 'Passw0rd123' };

// Logs in and returns what a browser would send back: "refresh_token=<value>"
const loginPair = async () => {
  const res = await request(app).post('/api/auth/login').send(credentials);
  return getCookiePair(getRefreshCookie(res));
};

const refresh = (pair) => {
  const req = request(app).post('/api/auth/refresh');
  return pair ? req.set('Cookie', pair) : req;
};

const valueOf = (pair) => pair.split('=')[1];
const activeTokens = () => prisma.refreshToken.count({ where: { revokedAt: null } });

describe('POST /api/auth/refresh', () => {
  beforeEach(async () => {
    await resetDb();
    await request(app)
      .post('/api/auth/register')
      .send({ ...credentials, fullName: 'Ahmed Test' });
  });

  it('returns a new access token and a new refresh cookie', async () => {
    const oldPair = await loginPair();
    const res = await refresh(oldPair);

    expect(res.status).toBe(200);
    expect(verifyAccessToken(res.body.data.accessToken).sub).toBe(res.body.data.user.id);
    expect(getCookiePair(getRefreshCookie(res))).not.toBe(oldPair);
  });

  it('rotates: the old token is cancelled and a new one is stored', async () => {
    const oldPair = await loginPair();
    const res = await refresh(oldPair);
    const newValue = getCookieValue(getRefreshCookie(res));

    const oldRow = await prisma.refreshToken.findUnique({
      where: { tokenHash: hashToken(valueOf(oldPair)) },
    });
    const newRow = await prisma.refreshToken.findUnique({
      where: { tokenHash: hashToken(newValue) },
    });

    expect(oldRow.revokedAt).not.toBeNull();
    expect(newRow.revokedAt).toBeNull();
    expect(await prisma.refreshToken.count()).toBe(2);
  });

  it('refuses to use the same token twice', async () => {
    const pair = await loginPair();
    await refresh(pair);
    const second = await refresh(pair);

    expect(second.status).toBe(401);
  });

  it('cancels every session when an old token is replayed (theft alarm)', async () => {
    const oldPair = await loginPair();
    const first = await refresh(oldPair);
    const newPair = getCookiePair(getRefreshCookie(first));

    await refresh(oldPair); // the thief replays the old token
    const legitimate = await refresh(newPair); // the real user's new token is dead too

    expect(legitimate.status).toBe(401);
    expect(await activeTokens()).toBe(0);
  });

  it('rejects a request with no cookie', async () => {
    const res = await refresh();

    expect(res.status).toBe(401);
  });

  it('rejects an unknown token and clears the cookie', async () => {
    const res = await refresh('refresh_token=this-token-does-not-exist');

    expect(res.status).toBe(401);
    expect(getRefreshCookie(res)).toContain('Expires=Thu, 01 Jan 1970');
  });

  it('rejects an expired token', async () => {
    const pair = await loginPair();
    await prisma.refreshToken.updateMany({ data: { expiresAt: new Date(Date.now() - 1000) } });

    const res = await refresh(pair);

    expect(res.status).toBe(401);
  });

  it('rejects a disabled account and cancels its sessions', async () => {
    const pair = await loginPair();
    await prisma.user.update({ where: { email: credentials.email }, data: { isActive: false } });

    const res = await refresh(pair);

    expect(res.status).toBe(403);
    expect(await activeTokens()).toBe(0);
  });

  it('keeps separate devices independent', async () => {
    const laptop = await loginPair();
    const phone = await loginPair();

    const laptopRefresh = await refresh(laptop);
    const phoneRefresh = await refresh(phone);

    expect(laptopRefresh.status).toBe(200);
    expect(phoneRefresh.status).toBe(200);
  });
});
