import fs from 'node:fs/promises';
import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import { resetDb } from './helpers/db.js';
import { adminToken, userToken } from './helpers/auth.js';
import { uploadDir } from '../src/utils/imageStorage.js';

let token;
let productId;

const auth = () => ({ Authorization: `Bearer ${token}` });
const url = (id) => `/api/admin/products/${id}/images`;

// a tiny fake PNG: the right first bytes are enough for our check
const pngBytes = () =>
  Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(20)]);

const upload = (id, buffer, filename = 'photo.png') =>
  request(app)
    .post(url(id))
    .set(auth())
    .attach('image', buffer, { filename, contentType: 'image/png' });

beforeEach(async () => {
  await resetDb();
  token = await adminToken();
  const cat = await request(app).post('/api/admin/categories').set(auth()).send({ name: 'Gloves' });
  const category = cat.body.data.category ?? cat.body.data;
  const prod = await request(app)
    .post('/api/admin/products')
    .set(auth())
    .send({ sku: 'IMG-1', name: 'Helmet', price: 10, categoryId: category.id });
  productId = (prod.body.data.product ?? prod.body.data).id;
});

afterAll(async () => {
  // safety: only ever delete the TEST folder
  if (uploadDir.includes('uploads-test')) {
    await fs.rm(uploadDir, { recursive: true, force: true });
  }
});

describe('POST /api/admin/products/:id/images', () => {
  it('uploads a PNG and stores its URL on the product', async () => {
    const res = await upload(productId, pngBytes());
    expect(res.status).toBe(201);
    expect(res.body.data.product.images).toHaveLength(1);
    expect(res.body.data.product.images[0]).toMatch(/^\/uploads\/[a-f0-9-]+\.png$/);
  });

  it('serves the uploaded file', async () => {
    const up = await upload(productId, pngBytes());
    const file = await request(app).get(up.body.data.product.images[0]);
    expect(file.status).toBe(200);
    expect(file.headers['content-type']).toContain('image/png');
  });

  it('rejects a fake image (text named .png)', async () => {
    const res = await upload(productId, Buffer.from('not an image'), 'evil.png');
    expect(res.status).toBe(400);
  });

  it('rejects a file over 5 MB', async () => {
    const res = await upload(productId, Buffer.alloc(5 * 1024 * 1024 + 1));
    expect(res.status).toBe(400);
  });

  it('rejects a request with no file', async () => {
    const res = await request(app).post(url(productId)).set(auth());
    expect(res.status).toBe(400);
  });

  it('rejects the 6th image', async () => {
    for (let i = 0; i < 5; i += 1) {
      const ok = await upload(productId, pngBytes());
      expect(ok.status).toBe(201);
    }
    const res = await upload(productId, pngBytes());
    expect(res.status).toBe(400);
  });

  it('returns 404 for an unknown product', async () => {
    const res = await upload('00000000-0000-4000-8000-000000000000', pngBytes());
    expect(res.status).toBe(404);
  });

  it('returns 401 without a token', async () => {
    const res = await request(app).post(url(productId)).attach('image', pngBytes(), 'a.png');
    expect(res.status).toBe(401);
  });

  it('returns 403 for a normal user', async () => {
    const res = await request(app)
      .post(url(productId))
      .set('Authorization', `Bearer ${await userToken()}`)
      .attach('image', pngBytes(), 'a.png');
    expect(res.status).toBe(403);
  });
});

describe('DELETE /api/admin/products/:id/images/:filename', () => {
  it('removes the image from the product and from the disk', async () => {
    const up = await upload(productId, pngBytes());
    const imageUrl = up.body.data.product.images[0];
    const filename = imageUrl.replace('/uploads/', '');

    const res = await request(app)
      .delete(`${url(productId)}/${filename}`)
      .set(auth());
    expect(res.status).toBe(200);
    expect(res.body.data.product.images).toEqual([]);

    const file = await request(app).get(imageUrl);
    expect(file.status).toBe(404);
  });

  it('returns 404 for an image that is not on the product', async () => {
    const res = await request(app)
      .delete(`${url(productId)}/aaaaaaaa-0000-4000-8000-000000000000.png`)
      .set(auth());
    expect(res.status).toBe(404);
  });

  it('rejects a bad filename', async () => {
    const res = await request(app)
      .delete(`${url(productId)}/not-an-image.exe`)
      .set(auth());
    expect(res.status).toBe(400);
  });
});
