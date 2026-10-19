import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import { prisma } from '../src/config/prisma.js';
import { verifyAccessToken } from '../src/utils/tokens.js';
import { resetDb } from './helpers/db.js';

const credentials = { email: 'ahmed@test.com', password: 'Passw0rd123' };

const register = () =>
  request(app)
    .post('/api/auth/register')
    .send({ ...credentials, fullName: 'Ahmed Test' });
const login = (body) => request(app).post('/api/auth/login').send(body);

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
});
