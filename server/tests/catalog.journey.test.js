import fs from 'node:fs/promises';
import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import { resetDb } from './helpers/db.js';
import { adminToken } from './helpers/auth.js';
import { uploadDir } from '../src/utils/imageStorage.js';

const pngBytes = () =>
  Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(20)]);

beforeEach(async () => {
  await resetDb();
});

afterAll(async () => {
  if (uploadDir.includes('uploads-test')) {
    await fs.rm(uploadDir, { recursive: true, force: true });
  }
});

describe('catalog journey', () => {
  it('admin builds the catalog, the public sees it, then admin hides it', async () => {
    const auth = { Authorization: `Bearer ${await adminToken()}` };

    const cat = await request(app)
      .post('/api/admin/categories')
      .set(auth)
      .send({ name: 'Helmets' });
    const category = cat.body.data.category ?? cat.body.data;

    const prod = await request(app).post('/api/admin/products').set(auth).send({
      sku: 'J-1',
      name: 'Journey Helmet',
      price: 20,
      discountPercent: 10,
      minQuantity: 5,
      categoryId: category.id,
    });
    expect(prod.status).toBe(201);
    const product = prod.body.data.product ?? prod.body.data;

    await request(app)
      .post(`/api/admin/products/${product.id}/images`)
      .set(auth)
      .attach('image', pngBytes(), { filename: 'a.png', contentType: 'image/png' });

    const list = await request(app).get('/api/products');
    expect(list.body.data.products).toHaveLength(1);
    expect(list.body.data.products[0].images).toHaveLength(1);

    const detail = await request(app).get('/api/products/journey-helmet');
    expect(Number(detail.body.data.product.finalPrice)).toBe(18);

    await request(app)
      .patch(`/api/admin/products/${product.id}`)
      .set(auth)
      .send({ isActive: false });

    const after = await request(app).get('/api/products');
    expect(after.body.data.products).toHaveLength(0);
    const gone = await request(app).get('/api/products/journey-helmet');
    expect(gone.status).toBe(404);
  });
});
