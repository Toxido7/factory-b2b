import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import { resetDb } from './helpers/db.js';
import { adminToken, userToken } from './helpers/auth.js';
import { CONTENT_FIELDS } from '../src/modules/content/content.fields.js';

const auth = (token) => ({ Authorization: `Bearer ${token}` });
const patch = (token, values) =>
  request(app).patch('/api/admin/content').set(auth(token)).send({ values });

describe('site content', () => {
  beforeEach(async () => {
    await resetDb();
  });

  it('public GET returns {} when nothing saved', async () => {
    const res = await request(app).get('/api/content');

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({ content: {} });
  });

  it('public GET returns saved values', async () => {
    await patch(await adminToken(), { 'general.tagline': 'Une valeur' });

    const res = await request(app).get('/api/content');

    expect(res.body.data.content).toEqual({ 'general.tagline': 'Une valeur' });
  });

  it('admin GET 401 without token', async () => {
    const res = await request(app).get('/api/admin/content');

    expect(res.status).toBe(401);
  });

  it('admin GET 403 for USER', async () => {
    const res = await request(app)
      .get('/api/admin/content')
      .set(auth(await userToken()));

    expect(res.status).toBe(403);
  });

  it('admin GET returns all 23 fields with null values', async () => {
    const res = await request(app)
      .get('/api/admin/content')
      .set(auth(await adminToken()));

    expect(res.status).toBe(200);
    expect(res.body.data.fields).toHaveLength(23);
    expect(res.body.data.fields.every((field) => field.value === null)).toBe(true);
  });

  it('admin GET returns a saved value', async () => {
    const token = await adminToken();
    await patch(token, { 'home.title': 'Titre' });

    const res = await request(app).get('/api/admin/content').set(auth(token));

    expect(res.body.data.fields.find((field) => field.key === 'home.title').value).toBe('Titre');
  });

  it('PATCH 401 without token', async () => {
    const res = await request(app)
      .patch('/api/admin/content')
      .send({ values: { 'home.title': 'Titre' } });

    expect(res.status).toBe(401);
  });

  it('PATCH 403 for USER', async () => {
    const res = await patch(await userToken(), { 'home.title': 'Titre' });

    expect(res.status).toBe(403);
  });

  it('PATCH saves one field', async () => {
    const res = await patch(await adminToken(), { 'home.title': 'Titre' });

    expect(res.status).toBe(200);
    expect(res.body.data.fields.find((field) => field.key === 'home.title').value).toBe('Titre');
  });

  it('PATCH saves several fields', async () => {
    const res = await patch(await adminToken(), {
      'home.title': 'Titre',
      'general.tagline': 'Slogan',
    });

    expect(res.status).toBe(200);
    expect(res.body.data.fields.filter((field) => field.value !== null)).toHaveLength(2);
  });

  it('PATCH trims spaces', async () => {
    const res = await patch(await adminToken(), { 'home.title': '  Titre  ' });

    expect(res.body.data.fields.find((field) => field.key === 'home.title').value).toBe('Titre');
  });

  it('PATCH empty string resets to default', async () => {
    const token = await adminToken();
    await patch(token, { 'home.title': 'Titre' });
    const res = await patch(token, { 'home.title': '   ' });

    expect(res.body.data.fields.find((field) => field.key === 'home.title').value).toBeNull();
    expect((await request(app).get('/api/content')).body.data.content).toEqual({});
  });

  it('PATCH unknown key 400', async () => {
    const res = await patch(await adminToken(), { unknown: 'value' });

    expect(res.status).toBe(400);
    expect(res.body.error.details.unknown).toBe('Unknown content field');
  });

  it('PATCH value too long 400', async () => {
    const res = await patch(await adminToken(), { 'home.title': 'x'.repeat(81) });

    expect(res.status).toBe(400);
  });

  it('PATCH invalid email 400', async () => {
    const res = await patch(await adminToken(), { 'contact.email': 'not-an-email' });

    expect(res.status).toBe(400);
  });

  it('PATCH invalid url 400', async () => {
    const res = await patch(await adminToken(), { 'contact.facebook': 'facebook.com/factory' });

    expect(res.status).toBe(400);
  });

  it('PATCH invalid phone 400', async () => {
    const res = await patch(await adminToken(), { 'contact.phone': 'abc' });

    expect(res.status).toBe(400);
  });

  it('PATCH empty values object 400', async () => {
    const res = await patch(await adminToken(), {});

    expect(res.status).toBe(400);
  });

  it('PATCH non-string value 400', async () => {
    const res = await patch(await adminToken(), { 'home.title': 123 });

    expect(res.status).toBe(400);
  });

  it('PATCH all-or-nothing', async () => {
    const res = await patch(await adminToken(), {
      'home.title': 'Titre valide',
      'contact.email': 'invalid',
    });

    expect(res.status).toBe(400);
    expect((await request(app).get('/api/content')).body.data.content).toEqual({});
  });

  it('field definitions are valid', () => {
    const types = new Set(['phone', 'email', 'textarea', 'url', 'text']);
    expect(new Set(CONTENT_FIELDS.map((field) => field.key)).size).toBe(CONTENT_FIELDS.length);
    expect(CONTENT_FIELDS.every((field) => types.has(field.type))).toBe(true);
    expect(CONTENT_FIELDS.every((field) => field.maxLength > 0)).toBe(true);
  });
});
