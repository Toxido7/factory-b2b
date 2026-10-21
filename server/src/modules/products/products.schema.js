import { z } from 'zod';

const twoDecimals = (n) => Math.round(n * 100) / 100 === n;

const sku = z.string().trim().min(1).max(50).toUpperCase();
const name = z.string().trim().min(2).max(150);
const description = z.string().trim().max(5000);
const price = z.number().positive().max(99999999.99).refine(twoDecimals, 'Max 2 decimals');
const minQuantity = z.number().int().min(1).max(1000000);
const discountPercent = z.number().min(0).max(100).refine(twoDecimals, 'Max 2 decimals');
const categoryId = z.string().uuid();

export const idParamsSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
});

export const createProductSchema = z.object({
  body: z.object({
    sku,
    name,
    description: description.optional(),
    price,
    minQuantity: minQuantity.optional(),
    discountPercent: discountPercent.optional(),
    categoryId,
  }),
});

export const updateProductSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z
    .object({
      sku: sku.optional(),
      name: name.optional(),
      description: description.nullable().optional(),
      price: price.optional(),
      minQuantity: minQuantity.optional(),
      discountPercent: discountPercent.optional(),
      categoryId: categoryId.optional(),
      isActive: z.boolean().optional(),
    })
    .refine((body) => Object.keys(body).length > 0, 'Nothing to update'),
});
export const listPublicSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(12),
    q: z.string().trim().min(1).optional(),
    category: z.string().trim().min(1).optional(),
    minPrice: z.coerce.number().min(0).optional(),
    maxPrice: z.coerce.number().min(0).optional(),
    sort: z.enum(['newest', 'price_asc', 'price_desc', 'name']).default('newest'),
  }),
});

export const slugParamSchema = z.object({
  params: z.object({ slug: z.string().trim().min(1) }),
});
export const imageUploadParamSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
});

export const imageDeleteParamSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
    filename: z.string().regex(/^[a-f0-9-]+\.(jpg|png|webp)$/),
  }),
});
