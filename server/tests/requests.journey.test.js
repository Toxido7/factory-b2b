import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('../src/utils/mailer.js', () => ({
  sendEmail: vi.fn().mockResolvedValue({}),
}));

import request from 'supertest';
import app from '../src/app.js';
import { env } from '../src/config/env.js';
import { prisma } from '../src/config/prisma.js';
import { sendEmail } from '../src/utils/mailer.js';
import { resetDb } from './helpers/db.js';
import { adminToken, userToken } from './helpers/auth.js';

let product;

beforeEach(async () => {
  vi.clearAllMocks();
  sendEmail.mockResolvedValue({});
  await resetDb();
  const category = await prisma.category.create({ data: { name: 'Gloves', slug: 'gloves' } });
  product = await prisma.product.create({
    data: {
      sku: 'J-1',
      name: 'Journey Glove',
      slug: 'journey-glove',
      price: '100.00',
      discountPercent: '15.00',
      minQuantity: 5,
      categoryId: category.id,
    },
  });
});

describe('requests journey', () => {
  it('a guest can browse the catalog but cannot send a request', async () => {
    const browse = await request(app).get('/api/products');
    expect(browse.status).toBe(200);
    expect(browse.body.data.products).toHaveLength(1);

    const send = await request(app)
      .post('/api/requests')
      .send({ items: [{ productId: product.id, quantity: 10 }] });
    expect(send.status).toBe(401);
  });

  it('customer sends a request, the team handles it, the customer sees the result', async () => {
    const userAuth = { Authorization: `Bearer ${await userToken()}` };
    const adminAuth = { Authorization: `Bearer ${await adminToken()}` };
    const body = { items: [{ productId: product.id, quantity: 10 }] };

    // 1. unverified email: blocked
    await prisma.user.updateMany({ where: { role: 'USER' }, data: { emailVerified: false } });
    const blocked = await request(app).post('/api/requests').set(userAuth).send(body);
    expect(blocked.status).toBe(403);

    // 2. verified email: request created
    await prisma.user.updateMany({ where: { role: 'USER' }, data: { emailVerified: true } });
    const created = await request(app).post('/api/requests').set(userAuth).send(body);
    expect(created.status).toBe(201);
    const { id, reference } = created.body.data.request;

    // 3. the team received an email about it
    const teamMailSent = sendEmail.mock.calls.some(
      ([mail]) => mail.to === env.TEAM_EMAIL && mail.subject.includes(reference),
    );
    expect(teamMailSent).toBe(true);

    // 4. the customer sees it as PENDING
    const mine = await request(app).get('/api/requests/mine').set(userAuth);
    expect(mine.body.data.requests[0]).toMatchObject({ reference, status: 'PENDING' });

    // 5. the admin finds it by reference and moves it along
    const found = await request(app).get(`/api/admin/requests?q=${reference}`).set(adminAuth);
    expect(found.body.data.requests[0].id).toBe(id);
    await request(app)
      .patch(`/api/admin/requests/${id}/status`)
      .set(adminAuth)
      .send({ status: 'CONTACTED' });
    await request(app)
      .patch(`/api/admin/requests/${id}/status`)
      .set(adminAuth)
      .send({ status: 'CONFIRMED' });

    // 6. the price changes later: the saved request must not change
    await prisma.product.update({ where: { id: product.id }, data: { price: '999.00' } });

    // 7. the customer sees the new status and the ORIGINAL prices
    const after = await request(app).get(`/api/requests/mine/${id}`).set(userAuth);
    expect(after.body.data.request.status).toBe('CONFIRMED');
    expect(after.body.data.request.estimatedTotal).toBe('850.00');
    expect(after.body.data.request.items[0].unitPrice).toBe('100.00');
  });
});
