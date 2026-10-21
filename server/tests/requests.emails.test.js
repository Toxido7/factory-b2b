import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('../src/utils/mailer.js', () => ({
  sendEmail: vi.fn().mockResolvedValue({}),
}));

import request from 'supertest';
import app from '../src/app.js';
import { env } from '../src/config/env.js';
import { prisma } from '../src/config/prisma.js';
import { sendEmail } from '../src/utils/mailer.js';
import { retryUnsentEmails } from '../src/modules/requests/requests.service.js';
import { resetDb } from './helpers/db.js';
import { userToken } from './helpers/auth.js';

let product;

beforeEach(async () => {
  vi.clearAllMocks();
  sendEmail.mockResolvedValue({});
  await resetDb();
  const category = await prisma.category.create({ data: { name: 'Gloves', slug: 'gloves' } });
  product = await prisma.product.create({
    data: {
      sku: 'G-1',
      name: 'Safety Glove',
      slug: 'safety-glove',
      price: '100.00',
      discountPercent: '15.00',
      minQuantity: 5,
      categoryId: category.id,
    },
  });
});

const sendRequest = async (extra = {}) => {
  const token = await userToken();
  await prisma.user.updateMany({ data: { emailVerified: true } });
  return request(app)
    .post('/api/requests')
    .set('Authorization', `Bearer ${token}`)
    .send({ items: [{ productId: product.id, quantity: 10 }], ...extra });
};

const mails = () => sendEmail.mock.calls.map(([message]) => message);
const teamMail = () => mails().find((m) => m.to === env.TEAM_EMAIL);

describe('request emails', () => {
  it('emails the team and marks the request as sent', async () => {
    const res = await sendRequest();
    expect(res.status).toBe(201);
    expect(teamMail().subject).toContain(res.body.data.request.reference);
    const saved = await prisma.orderRequest.findFirst();
    expect(saved.emailSentAt).not.toBeNull();
  });

  it('sends a confirmation to the customer', async () => {
    await sendRequest();
    const user = await prisma.user.findFirst();
    expect(mails().some((m) => m.to === user.email)).toBe(true);
  });

  it('puts the customer and the items in the team email', async () => {
    await sendRequest();
    const user = await prisma.user.findFirst();
    const { text } = teamMail();
    expect(text).toContain(user.email);
    expect(text).toContain('Safety Glove');
    expect(text).toContain('G-1');
    expect(text).toContain('850.00');
  });

  it('escapes HTML typed by the customer', async () => {
    await sendRequest({ notes: '<script>alert(1)</script>' });
    const { html } = teamMail();
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
  });

  it('keeps the request when the team email fails', async () => {
    sendEmail.mockRejectedValue(new Error('smtp down'));
    const res = await sendRequest();
    expect(res.status).toBe(201);
    const saved = await prisma.orderRequest.findFirst();
    expect(saved).not.toBeNull();
    expect(saved.emailSentAt).toBeNull();
  });

  it('still marks the request as sent when only the customer email fails', async () => {
    sendEmail.mockImplementation(async ({ to }) => {
      if (to !== env.TEAM_EMAIL) throw new Error('smtp down');
      return {};
    });
    const res = await sendRequest();
    expect(res.status).toBe(201);
    const saved = await prisma.orderRequest.findFirst();
    expect(saved.emailSentAt).not.toBeNull();
  });
});

describe('retryUnsentEmails', () => {
  it('sends the unsent requests and marks them', async () => {
    sendEmail.mockRejectedValue(new Error('smtp down'));
    await sendRequest();

    sendEmail.mockResolvedValue({});
    const result = await retryUnsentEmails({ olderThanMinutes: 0 });

    expect(result).toEqual({ found: 1, sent: 1 });
    const saved = await prisma.orderRequest.findFirst();
    expect(saved.emailSentAt).not.toBeNull();
  });

  it('ignores requests that were already sent', async () => {
    await sendRequest();
    vi.clearAllMocks();

    const result = await retryUnsentEmails({ olderThanMinutes: 0 });

    expect(result).toEqual({ found: 0, sent: 0 });
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it('keeps the request unsent when the email still fails', async () => {
    sendEmail.mockRejectedValue(new Error('smtp down'));
    await sendRequest();

    const result = await retryUnsentEmails({ olderThanMinutes: 0 });

    expect(result).toEqual({ found: 1, sent: 0 });
    const saved = await prisma.orderRequest.findFirst();
    expect(saved.emailSentAt).toBeNull();
  });

  it('skips very recent requests by default', async () => {
    sendEmail.mockRejectedValue(new Error('smtp down'));
    await sendRequest();

    const result = await retryUnsentEmails();

    expect(result).toEqual({ found: 0, sent: 0 });
  });
});
