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

export const forgotSchema = z.object({ email: z.email("validation.emailInvalid") });

export const resetSchema = z.object({ password });
