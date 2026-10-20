import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import { resetDb } from './helpers/db.js';
import { adminToken, userToken } from './helpers/auth.js';

const ADMIN_URL = '/api/admin/categories';

describe('categories', () => {
  let admin;

  const create = (body) =>
    request(app).post(ADMIN_URL).set('Authorization', `Bearer ${admin}`).send(body);

  beforeEach(async () => {
    await resetDb();
    admin = await adminToken();
  });

  it('blocks a guest (401)', async () => {
    const res = await request(app).post(ADMIN_URL).send({ name: 'Gloves' });
    expect(res.status).toBe(401);
  });

  it('blocks a normal user (403)', async () => {
    const user = await userToken();
    const res = await request(app).get(ADMIN_URL).set('Authorization', `Bearer ${user}`);
    expect(res.status).toBe(403);
  });

  it('lets the admin create a category with a generated slug', async () => {
    const res = await create({ name: 'Safety Gloves' });

    expect(res.status).toBe(201);
    expect(res.body.data.category.slug).toBe('safety-gloves');
  });

  it('rejects a duplicate name (409)', async () => {
    await create({ name: 'Gloves' });
    const res = await create({ name: 'Gloves' });
    expect(res.status).toBe(409);
  });

  it('rejects an invalid body (400)', async () => {
    const res = await create({ name: 'x' });
    expect(res.status).toBe(400);
  });

  it('allows one level of subcategories only', async () => {
    const parent = (await create({ name: 'Gloves' })).body.data.category;
    const child = await create({ name: 'Leather gloves', parentId: parent.id });
    expect(child.status).toBe(201);

    const grandchild = await create({
      name: 'Long leather gloves',
      parentId: child.body.data.category.id,
    });
    expect(grandchild.status).toBe(400);
  });

  it('rejects a category being its own parent', async () => {
    const category = (await create({ name: 'Gloves' })).body.data.category;

    const res = await request(app)
      .patch(`${ADMIN_URL}/${category.id}`)
      .set('Authorization', `Bearer ${admin}`)
      .send({ parentId: category.id });

    expect(res.status).toBe(400);
  });

  it('keeps the slug when the name changes', async () => {
    const category = (await create({ name: 'Gloves' })).body.data.category;

    const res = await request(app)
      .patch(`${ADMIN_URL}/${category.id}`)
      .set('Authorization', `Bearer ${admin}`)
      .send({ name: 'Work gloves' });

    expect(res.status).toBe(200);
    expect(res.body.data.category.name).toBe('Work gloves');
    expect(res.body.data.category.slug).toBe('gloves');
  });

  it('answers 404 for an unknown id and 400 for an empty update', async () => {
    const unknown = await request(app)
      .patch(`${ADMIN_URL}/3f2b8c1e-9d4a-4c1b-8f55-0a1b2c3d4e5f`)
      .set('Authorization', `Bearer ${admin}`)
      .send({ name: 'Whatever' });
    expect(unknown.status).toBe(404);

    const category = (await create({ name: 'Gloves' })).body.data.category;
    const empty = await request(app)
      .patch(`${ADMIN_URL}/${category.id}`)
      .set('Authorization', `Bearer ${admin}`)
      .send({});
    expect(empty.status).toBe(400);
  });

  it('hides a category from the public list but not from the admin list', async () => {
    await create({ name: 'Visible' });
    const hidden = (await create({ name: 'Hidden' })).body.data.category;
    await request(app)
      .patch(`${ADMIN_URL}/${hidden.id}`)
      .set('Authorization', `Bearer ${admin}`)
      .send({ isActive: false });

    const publicList = await request(app).get('/api/categories');
    const adminList = await request(app).get(ADMIN_URL).set('Authorization', `Bearer ${admin}`);

    expect(publicList.body.data.categories).toHaveLength(1);
    expect(publicList.body.data.categories[0].isActive).toBeUndefined();
    expect(adminList.body.data.categories).toHaveLength(2);
  });
});
