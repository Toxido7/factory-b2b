import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import { prisma } from '../src/config/prisma.js';
import * as usersService from '../src/modules/users/users.service.js';
import { resetDb } from './helpers/db.js';

const admin = {
  email: 'admin@test.com',
  password: 'A-Very-Long-Password-1',
  fullName: 'Test Admin',
};

describe('usersService.createAdmin', () => {
  beforeEach(async () => {
    await resetDb();
  });

  it('creates a verified ADMIN with a hashed password', async () => {
    const { created } = await usersService.createAdmin(admin);

    expect(created).toBe(true);
    const user = await prisma.user.findUnique({ where: { email: admin.email } });
    expect(user.role).toBe('ADMIN');
    expect(user.emailVerified).toBe(true);
    expect(user.passwordHash).not.toBe(admin.password);
  });

  it('creates an admin who can log in and is seen as ADMIN', async () => {
    await usersService.createAdmin(admin);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: admin.email, password: admin.password });

    expect(res.status).toBe(200);
    expect(res.body.data.user.role).toBe('ADMIN');
  });

  it('is idempotent: a second run changes nothing, not even the password', async () => {
    await usersService.createAdmin(admin);

    const second = await usersService.createAdmin({
      ...admin,
      password: 'Another-Long-Password-2',
    });

    expect(second.created).toBe(false);
    expect(await prisma.user.count()).toBe(1);
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: admin.email, password: admin.password });
    expect(res.status).toBe(200);
  });

  it('does not promote an existing customer to admin', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ email: admin.email, password: 'Password123', fullName: 'A Customer', phone: '20123456' });

    const { created } = await usersService.createAdmin(admin);

    expect(created).toBe(false);
    const user = await prisma.user.findUnique({ where: { email: admin.email } });
    expect(user.role).toBe('USER');
  });
});
