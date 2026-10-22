import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import { prisma } from '../src/config/prisma.js';
import { resetDb } from './helpers/db.js';

const creds = { email: 'pw@example.com', password: 'Password123' };
const auth = (token) => ({ Authorization: `Bearer ${token}` });
const login = (body = creds) => request(app).post('/api/auth/login').send(body);

// Registers a customer, logs in, returns the access token and the DB user
const setup = async (email = creds.email) => {
  await request(app)
    .post('/api/auth/register')
    .send({ ...creds, email, fullName: 'Pw User' });
  const res = await login({ ...creds, email });
  const user = await prisma.user.findUnique({ where: { email } });
  return { token: res.body.data.accessToken, user };
};

const activeTokens = (userId) => prisma.refreshToken.count({ where: { userId, revokedAt: null } });

const changePassword = (token, body) =>
  request(app).post('/api/auth/change-password').set(auth(token)).send(body);

beforeEach(async () => {
  await resetDb();
});

describe('POST /api/auth/change-password', () => {
  it('changes the password: the new one works, the old one does not', async () => {
    const { token } = await setup();

    const res = await changePassword(token, {
      currentPassword: creds.password,
      newPassword: 'NewPassword456',
    });

    expect(res.status).toBe(200);
    expect((await login({ ...creds, password: 'NewPassword456' })).status).toBe(200);
    expect((await login()).status).toBe(401);
  });

  it('revokes all refresh tokens of the user', async () => {
    const { token, user } = await setup();
    await login(); // a second session
    expect(await activeTokens(user.id)).toBe(2);

    await changePassword(token, {
      currentPassword: creds.password,
      newPassword: 'NewPassword456',
    });

    expect(await activeTokens(user.id)).toBe(0);
  });

  it('clears the refresh cookie', async () => {
    const { token } = await setup();

    const res = await changePassword(token, {
      currentPassword: creds.password,
      newPassword: 'NewPassword456',
    });

    const cookies = res.headers['set-cookie'] ?? [];
    expect(cookies.some((c) => c.startsWith('refresh_token=;'))).toBe(true);
  });

  it('returns 400 when the current password is wrong and changes nothing', async () => {
    const { token } = await setup();

    const res = await changePassword(token, {
      currentPassword: 'WrongPassword1',
      newPassword: 'NewPassword456',
    });

    expect(res.status).toBe(400);
    expect((await login()).status).toBe(200);
  });

  it('returns 400 when the new password equals the current one', async () => {
    const { token } = await setup();

    const res = await changePassword(token, {
      currentPassword: creds.password,
      newPassword: creds.password,
    });

    expect(res.status).toBe(400);
  });

  it('returns 400 when the new password is too weak', async () => {
    const { token } = await setup();

    const res = await changePassword(token, {
      currentPassword: creds.password,
      newPassword: 'abc',
    });

    expect(res.status).toBe(400);
  });

  it('returns 400 when fields are missing', async () => {
    const { token } = await setup();
    const res = await changePassword(token, {});
    expect(res.status).toBe(400);
  });

  it('returns 401 without a token', async () => {
    const res = await request(app)
      .post('/api/auth/change-password')
      .send({ currentPassword: creds.password, newPassword: 'NewPassword456' });
    expect(res.status).toBe(401);
  });
});

describe('POST /api/auth/logout-all', () => {
  it('revokes all sessions of the user and clears the cookie', async () => {
    const { token, user } = await setup();
    await login(); // a second session
    expect(await activeTokens(user.id)).toBe(2);

    const res = await request(app).post('/api/auth/logout-all').set(auth(token));

    expect(res.status).toBe(200);
    expect(await activeTokens(user.id)).toBe(0);
    const cookies = res.headers['set-cookie'] ?? [];
    expect(cookies.some((c) => c.startsWith('refresh_token=;'))).toBe(true);
  });

  it('does not touch the sessions of other users', async () => {
    const { token } = await setup();
    const other = await setup('other@example.com');

    await request(app).post('/api/auth/logout-all').set(auth(token));

    expect(await activeTokens(other.user.id)).toBe(1);
  });

  it('returns 401 without a token', async () => {
    const res = await request(app).post('/api/auth/logout-all');
    expect(res.status).toBe(401);
  });
});
