import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import { resetDb } from './helpers/db.js';

const creds = { email: 'logout@test.com', password: 'Password123' };

const login = async () => {
  const res = await request(app).post('/api/auth/login').send(creds);
  const cookie = res.headers['set-cookie'].find((c) => c.startsWith('refresh_token='));
  return cookie.split(';')[0]; // "refresh_token=abc..."
};

describe('POST /api/auth/logout', () => {
  beforeEach(async () => {
    await resetDb();
    await request(app)
      .post('/api/auth/register')
      .send({ ...creds, fullName: 'Logout Tester' });
  });

  it('returns 200 and clears the cookie', async () => {
    const cookie = await login();

    const res = await request(app).post('/api/auth/logout').set('Cookie', cookie);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    const cleared = res.headers['set-cookie'].find((c) => c.startsWith('refresh_token='));
    expect(cleared).toMatch(/^refresh_token=;/);
  });

  it('makes the old refresh token unusable', async () => {
    const cookie = await login();
    await request(app).post('/api/auth/logout').set('Cookie', cookie);

    const res = await request(app).post('/api/auth/refresh').set('Cookie', cookie);

    expect(res.status).toBe(401);
  });

  it('returns 200 when there is no cookie at all', async () => {
    const res = await request(app).post('/api/auth/logout');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('returns 200 when the cookie is garbage', async () => {
    const res = await request(app)
      .post('/api/auth/logout')
      .set('Cookie', 'refresh_token=this-token-does-not-exist');

    expect(res.status).toBe(200);
  });

  it('only ends the session that logged out, not the others', async () => {
    const laptop = await login();
    const phone = await login();

    await request(app).post('/api/auth/logout').set('Cookie', laptop);

    const res = await request(app).post('/api/auth/refresh').set('Cookie', phone);
    expect(res.status).toBe(200);
  });
});
