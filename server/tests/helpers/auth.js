import request from 'supertest';
import app from '../../src/app.js';
import * as usersService from '../../src/modules/users/users.service.js';
// Finds the refresh cookie in a response's Set-Cookie headers
export const getRefreshCookie = (res) =>
  (res.headers['set-cookie'] ?? []).find((c) => c.startsWith('refresh_token='));

// "refresh_token=abc; Path=...; HttpOnly"  →  "refresh_token=abc"  (what a browser sends back)
export const getCookiePair = (setCookie) => setCookie.split(';')[0];

// "refresh_token=abc"  →  "abc"
export const getCookieValue = (setCookie) => getCookiePair(setCookie).split('=')[1];

export const adminToken = async () => {
  const creds = { email: 'admin@test.com', password: 'A-Very-Long-Password-1' };
  await usersService.createAdmin({ ...creds, fullName: 'Test Admin' });
  const res = await request(app).post('/api/auth/login').send(creds);
  return res.body.data.accessToken;
};

export const userToken = async () => {
  const creds = { email: 'customer@test.com', password: 'Password123' };
  await request(app)
    .post('/api/auth/register')
    .send({ ...creds, fullName: 'Customer' });
  const res = await request(app).post('/api/auth/login').send(creds);
  return res.body.data.accessToken;
};
