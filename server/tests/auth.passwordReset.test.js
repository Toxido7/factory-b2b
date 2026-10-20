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

const user = { email: 'reset@test.com', password: 'Password123', fullName: 'Reset Tester' };
const newPassword = 'NewPassword456';

const lastEmailToken = () => sendEmail.mock.calls.at(-1)[0].text.match(/token=([\w-]+)/)[1];

const forgot = (email) => request(app).post('/api/auth/forgot-password').send({ email });
const reset = (token, password = newPassword) =>
  request(app).post('/api/auth/reset-password').send({ token, password });
const login = (password) =>
  request(app).post('/api/auth/login').send({ email: user.email, password });

const requestResetToken = async () => {
  await forgot(user.email);
  return lastEmailToken();
};

beforeEach(async () => {
  await resetDb();
  vi.clearAllMocks();
  sendEmail.mockResolvedValue({});
  await request(app).post('/api/auth/register').send(user);
  sendEmail.mockClear(); // forget the verification email sent by register
});

describe('POST /api/auth/forgot-password', () => {
  it('emails a reset link and stores only the hash, valid for about 1 hour', async () => {
    const res = await forgot(user.email);

    expect(res.status).toBe(200);
    expect(sendEmail).toHaveBeenCalledTimes(1);
    const mail = sendEmail.mock.calls[0][0];
    expect(mail.to).toBe(user.email);
    expect(mail.text).toContain('/reset-password?token=');

    const row = await prisma.verificationToken.findFirst({ where: { type: 'PASSWORD_RESET' } });
    expect(row.tokenHash).toBe(hashToken(lastEmailToken()));
    const hours = (row.expiresAt.getTime() - Date.now()) / (60 * 60 * 1000);
    expect(hours).toBeGreaterThan(0.9);
    expect(hours).toBeLessThanOrEqual(1);
  });

  it('gives the same answer for an unknown email and sends nothing', async () => {
    const known = await forgot(user.email);
    sendEmail.mockClear();

    const unknown = await forgot('nobody@test.com');

    expect(unknown.status).toBe(known.status);
    expect(unknown.body).toEqual(known.body);
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it('rejects an invalid email format', async () => {
    const res = await forgot('not-an-email');
    expect(res.status).toBe(400);
  });

  it('still answers 200 when the email cannot be sent', async () => {
    sendEmail.mockRejectedValueOnce(new Error('SMTP is down'));

    const res = await forgot(user.email);

    expect(res.status).toBe(200);
  });

  it('cancels the previous reset link when a new one is requested', async () => {
    const first = await requestResetToken();
    const second = await requestResetToken();

    expect((await reset(first)).status).toBe(400);
    expect((await reset(second)).status).toBe(200);
  });
});

describe('POST /api/auth/reset-password', () => {
  it('changes the password: the new one works and the old one does not', async () => {
    const token = await requestResetToken();

    const res = await reset(token);

    expect(res.status).toBe(200);
    expect((await login(newPassword)).status).toBe(200);
    expect((await login(user.password)).status).toBe(401);
  });

  it('rejects a token that was already used', async () => {
    const token = await requestResetToken();
    await reset(token);

    const res = await reset(token, 'AnotherPass789');

    expect(res.status).toBe(400);
  });

  it('rejects an unknown token', async () => {
    const res = await reset('this-token-does-not-exist');
    expect(res.status).toBe(400);
  });

  it('rejects an expired token and keeps the old password', async () => {
    const token = await requestResetToken();
    await prisma.verificationToken.updateMany({
      where: { type: 'PASSWORD_RESET' },
      data: { expiresAt: new Date(Date.now() - 1000) },
    });

    const res = await reset(token);

    expect(res.status).toBe(400);
    expect((await login(user.password)).status).toBe(200);
  });

  it('rejects an email-verification token (wrong type)', async () => {
    // register sent a verification email as its first email: create one again to read its token
    const verifyUser = await prisma.user.findUnique({ where: { email: user.email } });
    await prisma.verificationToken.create({
      data: {
        userId: verifyUser.id,
        type: 'EMAIL_VERIFY',
        tokenHash: hashToken('verify-token'),
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      },
    });

    const res = await reset('verify-token');

    expect(res.status).toBe(400);
    expect((await login(user.password)).status).toBe(200);
  });

  it('rejects a weak password without using up the token', async () => {
    const token = await requestResetToken();

    const weak = await reset(token, 'short');
    const retry = await reset(token);

    expect(weak.status).toBe(400);
    expect(retry.status).toBe(200);
  });

  it('logs out every device by revoking the refresh tokens', async () => {
    const loginRes = await login(user.password);
    const cookie = loginRes.headers['set-cookie']
      .find((c) => c.startsWith('refresh_token='))
      .split(';')[0];
    const token = await requestResetToken();

    await reset(token);
    const res = await request(app).post('/api/auth/refresh').set('Cookie', cookie);

    expect(res.status).toBe(401);
  });
});
