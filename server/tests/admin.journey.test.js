import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import { prisma } from '../src/config/prisma.js';
import { resetDb } from './helpers/db.js';
import { adminToken } from './helpers/auth.js';

const auth = (token) => ({ Authorization: `Bearer ${token}` });
const creds = { email: 'journey@example.com', password: 'Password123' };
const login = (password = creds.password) =>
  request(app).post('/api/auth/login').send({ email: creds.email, password });

beforeEach(async () => {
  await resetDb();
});

describe('Sprint 4 journey', () => {
  it('admin follows a customer from first request to disabled account', async () => {
    const admin = await adminToken();

    // 1. A verified customer and one product
    await request(app)
      .post('/api/auth/register')
      .send({ ...creds, phone: '20123456', fullName: 'Journey Customer' });
    await prisma.user.updateMany({ where: { role: 'USER' }, data: { emailVerified: true } });
    const customer = await prisma.user.findUnique({ where: { email: creds.email } });
    const category = await prisma.category.create({ data: { name: 'Gloves', slug: 'gloves' } });
    const product = await prisma.product.create({
      data: {
        sku: 'GLV-1',
        name: 'Work Gloves',
        slug: 'work-gloves',
        price: 100,
        minQuantity: 1,
        categoryId: category.id,
      },
    });

    // 2. The customer sends an order request, the admin confirms it
    const customerToken = (await login()).body.data.accessToken;
    const created = await request(app)
      .post('/api/requests')
      .set(auth(customerToken))
      .send({ items: [{ productId: product.id, quantity: 2 }] });
    expect(created.status).toBe(201);
    const requestId = (created.body.data.request ?? created.body.data).id;

    const confirmed = await request(app)
      .patch(`/api/admin/requests/${requestId}/status`)
      .set(auth(admin))
      .send({ status: 'CONFIRMED' });
    expect(confirmed.status).toBe(200);

    // 3. The dashboard shows it
    const overview = await request(app).get('/api/admin/stats/overview').set(auth(admin));
    expect(overview.body.data).toMatchObject({
      totalRequests: 1,
      conversionRate: 100,
      newCustomers: 1,
    });
    const topProducts = await request(app).get('/api/admin/stats/top-products').set(auth(admin));
    expect(topProducts.body.data.products[0]).toMatchObject({ sku: 'GLV-1', quantity: 2 });
    const topCustomers = await request(app).get('/api/admin/stats/top-customers').set(auth(admin));
    expect(topCustomers.body.data.customers[0].email).toBe(creds.email);

    // 4. The admin sees the customer with one request
    const detail = await request(app).get(`/api/admin/users/${customer.id}`).set(auth(admin));
    expect(detail.body.data.user.requestCount).toBe(1);

    // 5. The customer changes their password: old one is dead, new one works
    const changed = await request(app)
      .post('/api/auth/change-password')
      .set(auth(customerToken))
      .send({ currentPassword: creds.password, newPassword: 'NewPassword456' });
    expect(changed.status).toBe(200);
    expect((await login()).status).toBe(401);
    expect((await login('NewPassword456')).status).toBe(200);

    // 6. The admin promotes, then demotes, the customer
    const role = (value) =>
      request(app)
        .patch(`/api/admin/users/${customer.id}/role`)
        .set(auth(admin))
        .send({ role: value });
    expect((await role('ADMIN')).body.data.user.role).toBe('ADMIN');
    const active = () =>
      prisma.refreshToken.count({ where: { userId: customer.id, revokedAt: null } });
    expect(await active()).toBe(0); // promotion revoked the session
    expect((await role('USER')).body.data.user.role).toBe('USER');

    // 7. The admin disables the customer, then enables them again
    const status = (isActive) =>
      request(app)
        .patch(`/api/admin/users/${customer.id}/status`)
        .set(auth(admin))
        .send({ isActive });
    expect((await status(false)).status).toBe(200);
    expect((await login('NewPassword456')).status).toBe(403);
    expect((await status(true)).status).toBe(200);
    expect((await login('NewPassword456')).status).toBe(200);
  });
});
