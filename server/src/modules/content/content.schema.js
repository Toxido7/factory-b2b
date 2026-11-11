import { z } from 'zod';

export const updateContentSchema = z.object({
  body: z.object({
    values: z
      .record(z.string(), z.string())
      .refine((values) => Object.keys(values).length >= 1, 'At least one value is required')
      .refine((values) => Object.keys(values).length <= 50, 'At most 50 values are allowed'),
  }),
});
