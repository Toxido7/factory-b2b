import { z } from 'zod';

// Optional text: trims it, and turns an empty string "" into "not provided"
const optionalText = (max) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((value) => value || undefined);

export const registerSchema = z.object({
  body: z.object({
    email: z.string().trim().toLowerCase().email().max(255),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(72, 'Password must be at most 72 characters')
      .regex(/[A-Za-z]/, 'Password must contain a letter')
      .regex(/\d/, 'Password must contain a number'),
    fullName: z.string().trim().min(2).max(100),
    companyName: optionalText(150),
    phone: optionalText(30),
  }),
});
export const loginSchema = z.object({
  body: z.object({
    email: z.string().trim().toLowerCase().email(),
    password: z.string().min(1).max(128),
  }),
});
