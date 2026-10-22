import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import { openapi } from '../src/docs/openapi.js';
import { resetDb } from './helpers/db.js';
import { adminToken } from './helpers/auth.js';

const ID = '00000000-0000-4000-8000-000000000000';

// [METHOD, documented path, real path to call]
const operations = Object.entries(openapi.paths).flatMap(([path, methods]) =>
  Object.keys(methods).map((method) => [
    method.toUpperCase(),
    path,
    path
      .replaceAll('{id}', ID)
      .replaceAll('{filename}', 'photo.png')
      .replaceAll('{slug}', 'some-slug'),
  ]),
);

let token;
beforeAll(async () => {
  await resetDb();
  token = await adminToken();
});

describe('API docs', () => {
  it('serves the spec as JSON', async () => {
    const res = await request(app).get('/api-docs.json');

    expect(res.status).toBe(200);
    expect(res.body.openapi).toMatch(/^3\./);
    expect(Object.keys(res.body.paths).length).toBeGreaterThan(0);
  });

  it('serves the Swagger UI page', async () => {
    const res = await request(app).get('/api-docs/');

    expect(res.status).toBe(200);
    expect(res.text).toContain('swagger-ui');
  });

  it('gives every operation a summary and at least one response', () => {
    for (const [path, methods] of Object.entries(openapi.paths)) {
      for (const [method, op] of Object.entries(methods)) {
        expect(op.summary, `${method} ${path} has no summary`).toBeTruthy();
        expect(
          Object.keys(op.responses).length,
          `${method} ${path} has no responses`,
        ).toBeGreaterThan(0);
      }
    }
  });

  it('has no broken $ref', () => {
    const refs = [...JSON.stringify(openapi).matchAll(/"\$ref":"#\/([^"]+)"/g)].map((m) => m[1]);

    expect(refs.length).toBeGreaterThan(0);
    for (const r of refs) {
      const target = r.split('/').reduce((node, key) => node?.[key], openapi);
      expect(target, `broken $ref #/${r}`).toBeDefined();
    }
  });

  // Drift test. The admin token gets past the token checks, so a wrong path reaches
  // the "Route not found" handler. A real "Product not found" is a different message.
  it.each(operations)('%s %s is a real route', async (method, _path, realPath) => {
    const res = await request(app)
      [method.toLowerCase()](realPath)
      .set({ Authorization: `Bearer ${token}` });

    expect(res.body?.error?.message ?? '').not.toMatch(/^Route not found/);
  });
});
