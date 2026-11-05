import { z } from "zod";

// Same rules as the backend (auth.schema.js)
const password = z
  .string()
  .min(8, "validation.passwordMin")
  .max(72, "validation.passwordMax")
  .regex(/[A-Za-z]/, "validation.passwordLetter");

export const registerSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "validation.fullNameMin")
    .max(100, "validation.fullNameMax"),
  companyName: z.string().trim().max(150, "validation.companyMax").optional(),
  phone: z
    .string()
    .trim()
    .min(1, "validation.phoneRequired")
    .regex(/^\+?[0-9\s().-]{8,20}$/, "validation.phoneInvalid"),
  email: z.email("validation.emailInvalid"),
  password,
});

export const profileSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "validation.fullNameMin")
    .max(100, "validation.fullNameMax"),
  companyName: z
    .string()
    .trim()
    .max(150, "validation.companyMax")
    .optional()
    .transform((value) => (value === undefined ? undefined : value || null)),
  phone: z
    .string()
    .trim()
    .min(1, "validation.phoneRequired")
    .regex(/^\+?[0-9\s().-]{8,20}$/, "validation.phoneInvalid"),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "validation.passwordRequired"),
    newPassword: password,
    confirmPassword: z.string().min(1, "validation.passwordRequired"),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    path: ["confirmPassword"],
    message: "account.password.mismatch",
  });

export const categorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "validation.categoryNameMin")
    .max(100, "validation.categoryNameMax"),
  description: z
    .string()
    .trim()
    .max(500, "validation.categoryDescriptionMax")
    .optional(),
  parentId: z.string().optional(),
});

export const forgotSchema = z.object({ email: z.email("validation.emailInvalid") });

export const resetSchema = z.object({ password });
