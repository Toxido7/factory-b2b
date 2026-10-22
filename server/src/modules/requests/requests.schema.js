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
export const REQUEST_STATUSES = ['PENDING', 'CONTACTED', 'CONFIRMED', 'REJECTED', 'CANCELLED'];

export const listMineSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(10),
    status: z.enum(REQUEST_STATUSES).optional(),
  }),
});

export const requestIdParamSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
});
export const listAdminSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    status: z.enum(REQUEST_STATUSES).optional(),
    q: z.string().trim().min(1).max(100).optional(),
  }),
});

export const changeStatusSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({ status: z.enum(REQUEST_STATUSES) }),
});
