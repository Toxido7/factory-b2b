import { afterAll } from 'vitest';
import { prisma } from '../src/config/prisma.js';

const url = process.env.DATABASE_URL ?? '';

// Safety net: tests delete data, so they may only run on a *_test database
if (!url.includes('_test')) {
  const masked = url.replace(/:\/\/.*@/, '://***@');
  throw new Error(`Refusing to run tests: DATABASE_URL is not a test database (${masked})`);
}

afterAll(async () => {
  await prisma.$disconnect();
});
