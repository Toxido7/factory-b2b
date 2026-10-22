import { z } from 'zod';

// Accepts only real calendar days like 2026-03-31 (rejects 2026-02-31)
const day = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((s) => {
    const d = new Date(s);
    return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
  }, 'Invalid date');

const range = { from: day.optional(), to: day.optional() };
const limit = z.coerce.number().int().min(1).max(50).default(5);

export const rangeSchema = z.object({ query: z.object(range) });

export const timeSeriesSchema = z.object({
  query: z.object({ ...range, interval: z.enum(['day', 'month']).default('day') }),
});

export const topSchema = z.object({ query: z.object({ ...range, limit }) });
