import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';

vi.mock('../src/utils/mailer.js', () => ({
  sendEmail: vi.fn().mockResolvedValue({}),
}));

import app from '../src/app.js';
import { sendEmail } from '../src/utils/mailer.js';
import { resetDb } from './helpers/db.js';

const user = { email: 'journey@test.com', password: 'Password123', fullName: 'Journey Tester' };
const newPassword = 'NewPassword456';

const tokenFromEmail = (n) => sendEmail.mock.calls[n][0].text.match(/token=([\w-]+)/)[1];
const cookieFrom = (res) =>
  res.headers['set-cookie'].find((c) => c.startsWith('refresh_token=')).split(';')[0];
const login = (password) =>
  request(app).post('/api/auth/login').send({ email: user.email, password });

describe('the whole life of an account', () => {
  beforeEach(async () => {
    await resetDb();
    vi.clearAllMocks();
    sendEmail.mockResolvedValue({});
  });

  it('register, verify, login, refresh, logout, forgot and reset password', async () => {
    // 1. Register: the verification email goes out
    const registered = await request(app).post('/api/auth/register').send(user);
    expect(registered.status).toBe(201);
    expect(sendEmail).toHaveBeenCalledTimes(1);

    // 2. Login works, but the email is not verified yet
    const firstLogin = await login(user.password);
    expect(firstLogin.status).toBe(200);
    expect(firstLogin.body.data.user.emailVerified).toBe(false);

    // 3. Verify with the token from the email
    const verified = await request(app)
      .post('/api/auth/verify-email')
      .send({ token: tokenFromEmail(0) });
    expect(verified.status).toBe(200);

    // 4. /me now shows the email as verified
    const me = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${firstLogin.body.data.accessToken}`);
    expect(me.body.data.user.emailVerified).toBe(true);

    // 5. Refresh rotates the cookie
    const refreshed = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', cookieFrom(firstLogin));
    expect(refreshed.status).toBe(200);
    const newCookie = cookieFrom(refreshed);

    // 6. Logout kills that session
    const loggedOut = await request(app).post('/api/auth/logout').set('Cookie', newCookie);
    expect(loggedOut.status).toBe(200);
    const afterLogout = await request(app).post('/api/auth/refresh').set('Cookie', newCookie);
    expect(afterLogout.status).toBe(401);

    // 7. Forgot password, then reset with the token from the second email
    await request(app).post('/api/auth/forgot-password').send({ email: user.email });
    const reset = await request(app)
      .post('/api/auth/reset-password')
      .send({ token: tokenFromEmail(1), password: newPassword });
    expect(reset.status).toBe(200);

    // 8. The new password works, the old one does not
    expect((await login(newPassword)).status).toBe(200);
    expect((await login(user.password)).status).toBe(401);
  });
});
