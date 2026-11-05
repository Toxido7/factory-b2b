import { z } from 'zod';

// Optional text: trims it, and turns an empty string "" into "not provided"
const optionalText = (max) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((value) => value || undefined);

const passwordRule = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(72, 'Password must be at most 72 characters')
  .regex(/[A-Za-z]/, 'Password must contain a letter');

const phoneRule = z
  .string()
  .trim()
  .min(1, 'Phone number is required')
  .regex(/^\+?[0-9\s().-]{8,20}$/, 'Invalid phone number');

export const registerSchema = z.object({
  body: z.object({
    email: z.string().trim().toLowerCase().email().max(255),
    password: passwordRule,
    fullName: z.string().trim().min(2).max(100),
    companyName: optionalText(150),
    phone: phoneRule,
  }),
});
export const updateProfileSchema = z.object({
  body: z.object({
    fullName: z.string().trim().min(2).max(100),
    companyName: z
      .string()
      .trim()
      .max(150)
      .optional()
      .transform((value) => (value === undefined ? undefined : value || null)),
    phone: phoneRule,
  }),
});
export const loginSchema = z.object({
  body: z.object({
    email: z.string().trim().toLowerCase().email(),
    password: z.string().min(1).max(128),
  }),
});
export const verifyEmailSchema = z.object({
  body: z.object({
    token: z.string().min(1).max(200),
  }),
});
export const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string().trim().toLowerCase().email(),
  }),
});

export const resetPasswordSchema = z.object({
  body: z.object({
    token: z.string().min(1).max(200),
    password: passwordRule,
  }),
});
export const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(1).max(72),
    newPassword: passwordRule,
  }),
});
