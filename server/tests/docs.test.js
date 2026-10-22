import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import { openapi } from '../src/docs/openapi.js';

const ID = '00000000-0000-4000-8000-000000000000';

// An unknown slug is a legitimate 404, so these cannot be checked as "route exists"
const SKIP = new Set(['GET /api/products/{slug}']);

// [METHOD, documented path, real path to call]
const operations = Object.entries(openapi.paths)
  .flatMap(([path, methods]) =>
    Object.keys(methods).map((method) => [
      method.toUpperCase(),
      path,
      path.replaceAll('{id}', ID).replaceAll('{filename}', 'photo.png'),
    ]),
  )
  .filter(([method, path]) => !SKIP.has(`${method} ${path}`));

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

  // Drift test: a documented route that does not exist in the app answers 404
  it.each(operations)('%s %s is a real route', async (method, _path, realPath) => {
    const res = await request(app)[method.toLowerCase()](realPath);
    expect(res.status).not.toBe(404);
  });
});
