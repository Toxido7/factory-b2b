import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';

vi.mock('../src/utils/mailer.js', () => ({
  sendEmail: vi.fn().mockResolvedValue({}),
}));

import app from '../src/app.js';
import { prisma } from '../src/config/prisma.js';
import { sendEmail } from '../src/utils/mailer.js';
import { hashToken } from '../src/utils/tokens.js';
import { resetDb } from './helpers/db.js';

const user = {
  email: 'verify2@test.com',
  password: 'Password123',
  fullName: 'Verify Two',
  phone: '20123456',
};

// Reads the token out of the Nth email that "was sent"
const tokenFromEmail = (n) => sendEmail.mock.calls[n][0].text.match(/token=([\w-]+)/)[1];

const verify = (token) => request(app).post('/api/auth/verify-email').send({ token });

const registerAndGetToken = async () => {
  await request(app).post('/api/auth/register').send(user);
  return tokenFromEmail(0);
};

const loginAccessToken = async () => {
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email: user.email, password: user.password });
  return res.body.data.accessToken;
};

describe('POST /api/auth/verify-email', () => {
  beforeEach(async () => {
    await resetDb();
    vi.clearAllMocks();
    sendEmail.mockResolvedValue({});
  });

  it('verifies the user and marks the token as used', async () => {
    const token = await registerAndGetToken();

    const res = await verify(token);

    expect(res.status).toBe(200);
    const dbUser = await prisma.user.findUnique({ where: { email: user.email } });
    expect(dbUser.emailVerified).toBe(true);
    const row = await prisma.verificationToken.findFirst();
    expect(row.usedAt).not.toBeNull();
  });

  it('rejects a token that was already used', async () => {
    const token = await registerAndGetToken();
    await verify(token);

    const res = await verify(token);

    expect(res.status).toBe(400);
  });

  it('rejects an unknown token', async () => {
    const res = await verify('this-token-does-not-exist');
    expect(res.status).toBe(400);
  });

  it('rejects an expired token and leaves the user unverified', async () => {
    const token = await registerAndGetToken();
    await prisma.verificationToken.updateMany({ data: { expiresAt: new Date(Date.now() - 1000) } });

    const res = await verify(token);

    expect(res.status).toBe(400);
    const dbUser = await prisma.user.findUnique({ where: { email: user.email } });
    expect(dbUser.emailVerified).toBe(false);
  });

  it('rejects a request without a token (validation)', async () => {
    const res = await request(app).post('/api/auth/verify-email').send({});
    expect(res.status).toBe(400);
  });

  it('rejects a password-reset token (wrong type)', async () => {
    await registerAndGetToken();
    const dbUser = await prisma.user.findUnique({ where: { email: user.email } });
    await prisma.verificationToken.create({
      data: {
        userId: dbUser.id,
        type: 'PASSWORD_RESET',
        tokenHash: hashToken('reset-token'),
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      },
    });

    const res = await verify('reset-token');

    expect(res.status).toBe(400);
    const after = await prisma.user.findUnique({ where: { email: user.email } });
    expect(after.emailVerified).toBe(false);
  });
});

describe('POST /api/auth/resend-verification', () => {
  beforeEach(async () => {
    await resetDb();
    vi.clearAllMocks();
    sendEmail.mockResolvedValue({});
  });

  it('requires a login', async () => {
    const res = await request(app).post('/api/auth/resend-verification');
    expect(res.status).toBe(401);
  });

  it('sends a new email and cancels the old link', async () => {
    const oldToken = await registerAndGetToken();
    const access = await loginAccessToken();

    const res = await request(app)
      .post('/api/auth/resend-verification')
      .set('Authorization', `Bearer ${access}`);

    expect(res.status).toBe(200);
    expect(sendEmail).toHaveBeenCalledTimes(2);
    const newToken = tokenFromEmail(1);
    expect((await verify(oldToken)).status).toBe(400);
    expect((await verify(newToken)).status).toBe(200);
  });

  it('answers 409 and sends nothing when the email is already verified', async () => {
    const token = await registerAndGetToken();
    await verify(token);
    const access = await loginAccessToken();

    const res = await request(app)
      .post('/api/auth/resend-verification')
      .set('Authorization', `Bearer ${access}`);

    expect(res.status).toBe(409);
    expect(sendEmail).toHaveBeenCalledTimes(1);
  });
});
