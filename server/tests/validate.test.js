import { describe, it, expect } from 'vitest';
import express from 'express';
import request from 'supertest';
import { z } from 'zod';
import { validate } from '../src/middlewares/validate.js';
import { notFound, errorHandler } from '../src/middlewares/errorHandler.js';

const schema = z.object({
  body: z.object({
    email: z.string().email(),
    quantity: z.coerce.number().int().min(1),
  }),
});

const app = express();
app.use(express.json());
app.post('/test', validate(schema), (req, res) => {
  res.json({ data: req.validated.body });
});
app.use(notFound);
app.use(errorHandler);

describe('validate middleware', () => {
  it('accepts valid data and converts types', async () => {
    const res = await request(app).post('/test').send({ email: 'a@b.com', quantity: '5' });

    expect(res.status).toBe(200);
    expect(res.body.data.quantity).toBe(5); // text "5" became the number 5
  });

  it('rejects invalid data with details for each bad field', async () => {
    const res = await request(app).post('/test').send({ email: 'nope', quantity: 0 });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(Object.keys(res.body.error.details)).toEqual(
      expect.arrayContaining(['body.email', 'body.quantity']),
    );
  });

  it('removes fields that are not in the schema', async () => {
    const res = await request(app)
      .post('/test')
      .send({ email: 'a@b.com', quantity: 2, role: 'ADMIN' });

    expect(res.status).toBe(200);
    expect(res.body.data.role).toBeUndefined();
  });
});
