import { spawnSync } from 'node:child_process';
import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import { prisma } from '../src/config/prisma.js';
import { resetDb } from './helpers/db.js';
import { seedDemo } from '../src/seed/demoData.js';

beforeEach(async () => {
  await resetDb();
});

describe('seedDemo', () => {
  it('creates the demo categories and products', async () => {
    await seedDemo(prisma);
    expect(await prisma.category.count()).toBe(6);
    expect(await prisma.product.count()).toBe(11);
  });

  it('can run twice without duplicates', async () => {
    await seedDemo(prisma);
    await seedDemo(prisma);
    expect(await prisma.category.count()).toBe(6);
    expect(await prisma.product.count()).toBe(11);
  });

  it('shows only the 10 active products to the public', async () => {
    await seedDemo(prisma);
    const res = await request(app).get('/api/products?limit=50');
    expect(res.body.data.pagination.total).toBe(10);
  });
});

describe('seed script', () => {
  it('refuses to run in production', () => {
    const result = spawnSync(process.execPath, ['scripts/seed-demo.js'], {
      env: { ...process.env, NODE_ENV: 'production' },
      encoding: 'utf8',
    });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('Refusing');
  });
});
