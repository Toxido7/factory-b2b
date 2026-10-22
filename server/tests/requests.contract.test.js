import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import { resetDb } from './helpers/db.js';
import { userToken } from './helpers/auth.js';

const ID = '00000000-0000-4000-8000-000000000000';

const routes = [
  ['POST', '/api/requests'],
  ['GET', '/api/requests/mine'],
  ['GET', `/api/requests/mine/${ID}`],
  ['GET', '/api/admin/requests'],
  ['GET', `/api/admin/requests/${ID}`],
  ['PATCH', `/api/admin/requests/${ID}/status`],
];
const adminRoutes = routes.filter(([, path]) => path.startsWith('/api/admin'));

beforeEach(async () => {
  await resetDb();
});

describe('requests routes: authentication', () => {
  it.each(routes)('%s %s returns 401 without a token', async (method, path) => {
    const res = await request(app)[method.toLowerCase()](path);
    expect(res.status).toBe(401);
  });
});

describe('admin requests routes: authorization', () => {
  it.each(adminRoutes)('%s %s returns 403 for a normal user', async (method, path) => {
    const token = await userToken();
    const res = await request(app)
      [method.toLowerCase()](path)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });
});
