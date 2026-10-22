import { z } from 'zod';

const idParams = z.object({ id: z.string().uuid() });

export const listUsersSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    q: z.string().trim().min(1).max(100).optional(),
    isActive: z
      .enum(['true', 'false'])
      .transform((v) => v === 'true')
      .optional(),
    role: z.enum(['USER', 'ADMIN']).optional(),
  }),
});

export const userIdSchema = z.object({ params: idParams });

export const setStatusSchema = z.object({
  params: idParams,
  body: z.object({ isActive: z.boolean() }),
});
export const setRoleSchema = z.object({
  params: idParams,
  body: z.object({ role: z.enum(['USER', 'ADMIN']) }),
});
