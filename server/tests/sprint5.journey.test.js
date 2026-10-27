import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import { prisma } from '../src/config/prisma.js';
import { resetDb } from './helpers/db.js';
import { cleanupExpiredTokens } from '../src/modules/auth/auth.service.js';

const DAY = 24 * 60 * 60 * 1000;
const creds = { email: 'cleanup@example.com', password: 'Password123' };
const firstCookie = (res) => res.headers['set-cookie'][0].split(';')[0];

beforeEach(async () => {
  await resetDb();
});

describe('Sprint 5 journey', () => {
  it('documents the API, and cleanup removes only old expired sessions', async () => {
    // 1. The docs describe the API
    const docs = await request(app).get('/api-docs.json');
    expect(docs.body.paths['/api/auth/login']).toBeDefined();

    // 2. Two sessions: the first one expired 30 days ago, the second is fresh
    await request(app)
      .post('/api/auth/register')
      .send({ ...creds, phone: '20123456', fullName: 'Cleanup User' });
    const oldCookie = firstCookie(await request(app).post('/api/auth/login').send(creds));
    const user = await prisma.user.findUnique({ where: { email: creds.email } });
    await prisma.refreshToken.updateMany({
      where: { userId: user.id },
      data: { expiresAt: new Date(Date.now() - 30 * DAY) },
    });
    const freshCookie = firstCookie(await request(app).post('/api/auth/login').send(creds));
    expect(await prisma.refreshToken.count({ where: { userId: user.id } })).toBe(2);

    // 3. Cleanup deletes only the old one
    const result = await cleanupExpiredTokens({ olderThanDays: 7 });
    expect(result).toEqual({ refreshTokens: 1, verificationTokens: 0 });
    expect(await prisma.refreshToken.count({ where: { userId: user.id } })).toBe(1);

    // 4. The old cookie is dead, the fresh one still works
    const oldRefresh = await request(app).post('/api/auth/refresh').set('Cookie', oldCookie);
    const freshRefresh = await request(app).post('/api/auth/refresh').set('Cookie', freshCookie);
    expect(oldRefresh.status).toBe(401);
    expect(freshRefresh.status).toBe(200);
  });
});
