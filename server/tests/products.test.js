import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import { resetDb } from './helpers/db.js';
import { adminToken, userToken } from './helpers/auth.js';

const URL = '/api/admin/products';

describe('admin products', () => {
  let admin;
  let category;

  const post = (body) => request(app).post(URL).set('Authorization', `Bearer ${admin}`).send(body);
  const patch = (id, body) =>
    request(app).patch(`${URL}/${id}`).set('Authorization', `Bearer ${admin}`).send(body);
  const productBody = (overrides = {}) => ({
    sku: 'gl-001',
    name: 'Work gloves',
    price: 19.99,
    minQuantity: 50,
    discountPercent: 5,
    categoryId: category.id,
    ...overrides,
  });

  beforeEach(async () => {
    await resetDb();
    admin = await adminToken();
    const res = await request(app)
      .post('/api/admin/categories')
      .set('Authorization', `Bearer ${admin}`)
      .send({ name: 'Gloves' });
    category = res.body.data.category;
  });

  it('blocks a guest (401)', async () => {
    const res = await request(app).get(URL);
    expect(res.status).toBe(401);
  });

  it('blocks a normal user (403)', async () => {
    const user = await userToken();
    const res = await request(app).get(URL).set('Authorization', `Bearer ${user}`);
    expect(res.status).toBe(403);
  });

  it('creates a product: uppercase sku, generated slug, exact price', async () => {
    const res = await post(productBody());

    expect(res.status).toBe(201);
    const product = res.body.data.product;
    expect(product.sku).toBe('GL-001');
    expect(product.slug).toBe('work-gloves');
    expect(Number(product.price)).toBe(19.99);
    expect(product.minQuantity).toBe(50);
    expect(product.category.name).toBe('Gloves');
  });

  it('rejects a duplicate sku (409)', async () => {
    await post(productBody());
    const res = await post(productBody({ name: 'Other gloves' }));
    expect(res.status).toBe(409);
  });

  it('rejects an unknown category (400)', async () => {
    const res = await post(productBody({ categoryId: '3f2b8c1e-9d4a-4c1b-8f55-0a1b2c3d4e5f' }));
    expect(res.status).toBe(400);
  });

  it.each([0, -5, 19.999, 'abc'])('rejects the price %s (400)', async (price) => {
    const res = await post(productBody({ price }));
    expect(res.status).toBe(400);
  });

  it('rejects a bad discount and a bad minimum quantity (400)', async () => {
    const discount = await post(productBody({ discountPercent: 150 }));
    const minimum = await post(productBody({ minQuantity: 0 }));

    expect(discount.status).toBe(400);
    expect(minimum.status).toBe(400);
  });

  it('updates price and minimum quantity, and keeps the slug on rename', async () => {
    const product = (await post(productBody())).body.data.product;

    const res = await patch(product.id, { price: 24.5, minQuantity: 100, name: 'Heavy gloves' });

    expect(res.status).toBe(200);
    expect(Number(res.body.data.product.price)).toBe(24.5);
    expect(res.body.data.product.minQuantity).toBe(100);
    expect(res.body.data.product.slug).toBe('work-gloves');
  });

  it('rejects moving a product to an unknown category (400)', async () => {
    const product = (await post(productBody())).body.data.product;

    const res = await patch(product.id, { categoryId: '3f2b8c1e-9d4a-4c1b-8f55-0a1b2c3d4e5f' });

    expect(res.status).toBe(400);
  });

  it('hides a product and still shows it in the admin list', async () => {
    const product = (await post(productBody())).body.data.product;

    await patch(product.id, { isActive: false });
    const list = await request(app).get(URL).set('Authorization', `Bearer ${admin}`);

    expect(list.body.data.products).toHaveLength(1);
    expect(list.body.data.products[0].isActive).toBe(false);
  });

  it('answers 404 for an unknown product', async () => {
    const res = await request(app)
      .get(`${URL}/3f2b8c1e-9d4a-4c1b-8f55-0a1b2c3d4e5f`)
      .set('Authorization', `Bearer ${admin}`);
    expect(res.status).toBe(404);
  });
});
