import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import { resetDb } from './helpers/db.js';
import { adminToken } from './helpers/auth.js';

let token;
let n = 0;

beforeEach(async () => {
  await resetDb();
  token = await adminToken();
});

const auth = () => ({ Authorization: `Bearer ${token}` });

// helpers: build data through the admin API (adapt if your response shape differs)
const makeCategory = async (name, extra = {}) => {
  const res = await request(app)
    .post('/api/admin/categories')
    .set(auth())
    .send({ name, ...extra });
  return res.body.data.category ?? res.body.data;
};

const makeProduct = async (categoryId, overrides = {}) => {
  n += 1;
  const res = await request(app)
    .post('/api/admin/products')
    .set(auth())
    .send({ sku: `SKU-${n}`, name: `Product ${n}`, price: 10, categoryId, ...overrides });
  return res.body.data.product ?? res.body.data;
};

const hide = (type, id) =>
  request(app).patch(`/api/admin/${type}/${id}`).set(auth()).send({ isActive: false });

const names = (res) => res.body.data.products.map((p) => p.name);

describe('GET /api/products', () => {
  it('lists only active products', async () => {
    const cat = await makeCategory('Gloves');
    await makeProduct(cat.id, { name: 'Visible' });
    const hidden = await makeProduct(cat.id, { name: 'Hidden' });
    await hide('products', hidden.id);

    const res = await request(app).get('/api/products');
    expect(res.status).toBe(200);
    expect(names(res)).toEqual(['Visible']);
  });

  it('hides products of an inactive category', async () => {
    const cat = await makeCategory('Gloves');
    await makeProduct(cat.id);
    await hide('categories', cat.id);

    const res = await request(app).get('/api/products');
    expect(res.body.data.products).toHaveLength(0);
  });

  it('does not leak private fields', async () => {
    const cat = await makeCategory('Gloves');
    await makeProduct(cat.id, { name: 'Safe' });

    const res = await request(app).get('/api/products');
    const product = res.body.data.products[0];
    expect(product).not.toHaveProperty('isActive');
    expect(product).not.toHaveProperty('createdAt');
    expect(product).not.toHaveProperty('categoryId');
    expect(product.category).toEqual({ name: 'Gloves', slug: 'gloves' });
  });

  it('computes finalPrice after discount', async () => {
    const cat = await makeCategory('Gloves');
    await makeProduct(cat.id, { price: 100, discountPercent: 15 });

    const res = await request(app).get('/api/products');
    const product = res.body.data.products[0];
    expect(Number(product.price)).toBe(100);
    expect(Number(product.finalPrice)).toBe(85);
  });

  it('paginates and returns totals', async () => {
    const cat = await makeCategory('Gloves');
    await makeProduct(cat.id);
    await makeProduct(cat.id);
    await makeProduct(cat.id);

    const res = await request(app).get('/api/products?limit=2&page=2');
    expect(res.body.data.products).toHaveLength(1);
    expect(res.body.data.pagination).toEqual({ page: 2, limit: 2, total: 3, totalPages: 2 });
  });

  it('rejects a limit above 50', async () => {
    const res = await request(app).get('/api/products?limit=51');
    expect(res.status).toBe(400);
  });

  it('searches by name, case-insensitive', async () => {
    const cat = await makeCategory('Gloves');
    await makeProduct(cat.id, { name: 'Blue Helmet' });
    await makeProduct(cat.id, { name: 'Red Gloves' });

    const res = await request(app).get('/api/products?q=HELMET');
    expect(names(res)).toEqual(['Blue Helmet']);
  });

  it('filters by category slug including subcategories', async () => {
    const parent = await makeCategory('Protection');
    const child = await makeCategory('Gloves', { parentId: parent.id });
    const other = await makeCategory('Boots');
    await makeProduct(child.id, { name: 'In Child' });
    await makeProduct(other.id, { name: 'In Other' });

    const res = await request(app).get('/api/products?category=protection');
    expect(names(res)).toEqual(['In Child']);
  });

  it('filters by min and max price', async () => {
    const cat = await makeCategory('Gloves');
    await makeProduct(cat.id, { price: 5 });
    await makeProduct(cat.id, { price: 20 });
    await makeProduct(cat.id, { price: 50 });

    const res = await request(app).get('/api/products?minPrice=10&maxPrice=30');
    expect(res.body.data.products.map((p) => Number(p.price))).toEqual([20]);
  });

  it('sorts by price ascending', async () => {
    const cat = await makeCategory('Gloves');
    await makeProduct(cat.id, { price: 30 });
    await makeProduct(cat.id, { price: 10 });
    await makeProduct(cat.id, { price: 20 });

    const res = await request(app).get('/api/products?sort=price_asc');
    expect(res.body.data.products.map((p) => Number(p.price))).toEqual([10, 20, 30]);
  });

  it('rejects an unknown sort value', async () => {
    const res = await request(app).get('/api/products?sort=banana');
    expect(res.status).toBe(400);
  });
});

describe('GET /api/products/:slug', () => {
  it('returns a product by slug', async () => {
    const cat = await makeCategory('Gloves');
    await makeProduct(cat.id, { name: 'Safety Helmet' });

    const res = await request(app).get('/api/products/safety-helmet');
    expect(res.status).toBe(200);
    expect(res.body.data.product.name).toBe('Safety Helmet');
    expect(res.body.data.product.category.slug).toBe('gloves');
  });

  it('returns 404 for an inactive product', async () => {
    const cat = await makeCategory('Gloves');
    const product = await makeProduct(cat.id, { name: 'Old Helmet' });
    await hide('products', product.id);

    const res = await request(app).get('/api/products/old-helmet');
    expect(res.status).toBe(404);
  });

  it('returns 404 for an unknown slug', async () => {
    const res = await request(app).get('/api/products/does-not-exist');
    expect(res.status).toBe(404);
  });
});
