import { z } from 'zod';

export const createRequestSchema = z.object({
  body: z.object({
    notes: z.string().trim().max(1000).optional(),
    items: z
      .array(
        z.object({
          productId: z.string().uuid(),
          quantity: z.number().int().min(1).max(100000),
        }),
      )
      .min(1)
      .max(50)
      .refine((items) => new Set(items.map((i) => i.productId)).size === items.length, {
        message: 'Duplicate products are not allowed',
      }),
  }),
});
