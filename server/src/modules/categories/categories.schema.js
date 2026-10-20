import { z } from 'zod';

const name = z.string().trim().min(2).max(100);
const description = z.string().trim().max(500);

export const createCategorySchema = z.object({
  body: z.object({
    name,
    description: description.optional(),
    parentId: z.string().uuid().optional(),
  }),
});

export const updateCategorySchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z
    .object({
      name: name.optional(),
      description: description.nullable().optional(),
      parentId: z.string().uuid().nullable().optional(),
      isActive: z.boolean().optional(),
    })
    .refine((body) => Object.keys(body).length > 0, 'Nothing to update'),
});
