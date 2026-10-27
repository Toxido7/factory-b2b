import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import { prisma } from '../src/config/prisma.js';
import { verifyAccessToken, hashToken } from '../src/utils/tokens.js';
import { resetDb } from './helpers/db.js';

const credentials = { email: 'ahmed@test.com', password: 'Passw0rd123' };

const register = () =>
  request(app)
    .post('/api/auth/register')
    .send({ ...credentials, phone: '20123456', fullName: 'Ahmed Test' });
const login = (body) => request(app).post('/api/auth/login').send(body);
const getRefreshCookie = (res) =>
  (res.headers['set-cookie'] ?? []).find((c) => c.startsWith('refresh_token='));

const getCookieValue = (cookie) => cookie.split(';')[0].split('=')[1];
describe('POST /api/auth/login', () => {
  beforeEach(async () => {
    await resetDb();
    await register();
  });

  it('logs in and returns a valid access token', async () => {
    const res = await login(credentials);
    const payload = verifyAccessToken(res.body.data.accessToken);

    expect(res.status).toBe(200);
    expect(payload.sub).toBe(res.body.data.user.id);
    expect(payload.role).toBe('USER');
  });

  it('never returns the password hash', async () => {
    const res = await login(credentials);

    expect(res.body.data.user.passwordHash).toBeUndefined();
  });

  it('accepts the email in different capitals', async () => {
    const res = await login({ ...credentials, email: 'AHMED@Test.com' });

    expect(res.status).toBe(200);
  });

  it('rejects a wrong password', async () => {
    const res = await login({ ...credentials, password: 'WrongPassw0rd' });

    expect(res.status).toBe(401);
  });

  it('gives the same error for an unknown email and a wrong password', async () => {
    const wrongPassword = await login({ ...credentials, password: 'WrongPassw0rd' });
    const unknownEmail = await login({ ...credentials, email: 'nobody@test.com' });

    expect(unknownEmail.status).toBe(401);
    expect(unknownEmail.body.error.message).toBe(wrongPassword.body.error.message);
  });

  it('rejects a disabled account', async () => {
    await prisma.user.update({ where: { email: credentials.email }, data: { isActive: false } });
    const res = await login(credentials);

    expect(res.status).toBe(403);
  });

  it('rejects a missing password with a validation error', async () => {
    const res = await login({ email: credentials.email });

    expect(res.status).toBe(400);
  });
  it('sets the refresh token in a protected cookie', async () => {
    const res = await login(credentials);
    const cookie = getRefreshCookie(res);

    expect(cookie).toBeDefined();
    expect(cookie).toContain('HttpOnly');
    expect(cookie).toContain('Path=/api/auth');
    expect(cookie).toContain('SameSite=Lax');
    expect(cookie).not.toContain('Secure'); // only in production
  });

  it('never puts the refresh token in the response body', async () => {
    const res = await login(credentials);
    const token = getCookieValue(getRefreshCookie(res));

    expect(JSON.stringify(res.body)).not.toContain(token);
  });

  it('stores only the hash of the refresh token, with an expiry', async () => {
    const res = await login(credentials);
    const token = getCookieValue(getRefreshCookie(res));

    const rows = await prisma.refreshToken.findMany();

    expect(rows).toHaveLength(1);
    expect(rows[0].tokenHash).not.toBe(token);
    expect(rows[0].tokenHash).toBe(hashToken(token));
    expect(rows[0].userId).toBe(res.body.data.user.id);
    expect(rows[0].expiresAt.getTime()).toBeGreaterThan(Date.now() + 6 * 24 * 60 * 60 * 1000);
  });

  it('creates a separate token for every login', async () => {
    await login(credentials);
    await login(credentials);

    expect(await prisma.refreshToken.count()).toBe(2);
  });

  it('creates no token when the login fails', async () => {
    await login({ ...credentials, password: 'WrongPassw0rd' });

    expect(await prisma.refreshToken.count()).toBe(0);
  });
});
