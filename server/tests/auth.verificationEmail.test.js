import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { prisma } from '../../src/config/prisma.js';

vi.mock('../src/utils/mailer.js', () => ({
  sendEmail: vi.fn().mockResolvedValue({}),
}));

import app from '../src/app.js';
import { prisma } from '../src/config/prisma.js';
import { sendEmail } from '../src/utils/mailer.js';
import { hashToken } from '../src/utils/tokens.js';
import { resetDb } from './helpers/db.js';

const newUser = { email: 'verify@test.com', password: 'Password123', fullName: 'Verify Tester' };

const tokenFromEmail = () => {
  const { text } = sendEmail.mock.calls[0][0];
  return text.match(/token=([\w-]+)/)[1];
};

describe('verification email after register', () => {
  beforeEach(async () => {
    await resetDb();
    vi.clearAllMocks();
    sendEmail.mockResolvedValue({});
  });

  it('sends one email to the new user with a verification link', async () => {
    await request(app).post('/api/auth/register').send(newUser);

    expect(sendEmail).toHaveBeenCalledTimes(1);
    const mail = sendEmail.mock.calls[0][0];
    expect(mail.to).toBe(newUser.email);
    expect(mail.text).toContain('/verify-email?token=');
  });

  it('stores only the hash, with the right type and a 24h expiry', async () => {
    await request(app).post('/api/auth/register').send(newUser);
    const token = tokenFromEmail();

    const rows = await prisma.verificationToken.findMany();

    expect(rows).toHaveLength(1);
    expect(rows[0].type).toBe('EMAIL_VERIFY');
    expect(rows[0].tokenHash).toBe(hashToken(token));
    expect(rows[0].tokenHash).not.toBe(token);
    const hours = (rows[0].expiresAt.getTime() - Date.now()) / (60 * 60 * 1000);
    expect(hours).toBeGreaterThan(23);
    expect(hours).toBeLessThanOrEqual(24);
  });

  it('still registers the user when sending the email fails', async () => {
    sendEmail.mockRejectedValueOnce(new Error('SMTP is down'));

    const res = await request(app).post('/api/auth/register').send(newUser);

    expect(res.status).toBe(201);
    const users = await prisma.user.findMany();
    expect(users).toHaveLength(1);
  });

  it('sends no email when the registration is rejected (duplicate email)', async () => {
    await request(app).post('/api/auth/register').send(newUser);
    vi.clearAllMocks();

    const res = await request(app).post('/api/auth/register').send(newUser);

    expect(res.status).toBe(409);
    expect(sendEmail).not.toHaveBeenCalled();
  });
});
