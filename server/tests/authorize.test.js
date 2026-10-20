import { describe, it, expect } from 'vitest';
import request from 'supertest';
import express from 'express';
import { authenticate } from '../src/middlewares/authenticate.js';
import { authorize } from '../src/middlewares/authorize.js';
import { notFound, errorHandler } from '../src/middlewares/errorHandler.js';
import { signAccessToken } from '../src/utils/tokens.js';

const practiceApp = express();
const ok = (req, res) => res.json({ success: true });

practiceApp.get('/admin-only', authenticate, authorize('ADMIN'), ok);
practiceApp.get('/any-logged-in', authenticate, authorize('USER', 'ADMIN'), ok);
practiceApp.get('/forgot-authenticate', authorize('ADMIN'), ok);
practiceApp.use(notFound);
practiceApp.use(errorHandler);

const tokenFor = (role) => signAccessToken({ id: 'some-user-id', role });

describe('authorize middleware', () => {
  it('returns 401 when there is no token (authenticate stops it first)', async () => {
    const res = await request(practiceApp).get('/admin-only');
    expect(res.status).toBe(401);
  });

  it('returns 403 when a USER tries an admin-only route', async () => {
    const res = await request(practiceApp)
      .get('/admin-only')
      .set('Authorization', `Bearer ${tokenFor('USER')}`);
    expect(res.status).toBe(403);
  });

  it('returns 200 when an ADMIN uses an admin-only route', async () => {
    const res = await request(practiceApp)
      .get('/admin-only')
      .set('Authorization', `Bearer ${tokenFor('ADMIN')}`);
    expect(res.status).toBe(200);
  });

  it('accepts any role from the allowed list', async () => {
    const asUser = await request(practiceApp)
      .get('/any-logged-in')
      .set('Authorization', `Bearer ${tokenFor('USER')}`);
    const asAdmin = await request(practiceApp)
      .get('/any-logged-in')
      .set('Authorization', `Bearer ${tokenFor('ADMIN')}`);

    expect(asUser.status).toBe(200);
    expect(asAdmin.status).toBe(200);
  });

  it('stays locked (401) if someone forgot to put authenticate first', async () => {
    const res = await request(practiceApp)
      .get('/forgot-authenticate')
      .set('Authorization', `Bearer ${tokenFor('ADMIN')}`);
    expect(res.status).toBe(401);
  });
});
