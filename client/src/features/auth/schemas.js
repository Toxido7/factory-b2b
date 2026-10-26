import { z } from "zod";

// Same rules as the backend (auth.schema.js)
const password = z
  .string()
  .min(8, "At least 8 characters")
  .max(72, "At most 72 characters")
  .regex(/[A-Za-z]/, "Must contain a letter");

export const registerSchema = z.object({
  fullName: z.string().trim().min(2, "At least 2 characters").max(100),
  companyName: z.string().trim().max(150).optional(),
  phone: z
    .string()
    .trim()
    .min(1, "Phone number is required")
    .regex(/^\+?[0-9\s().-]{8,20}$/, "Invalid phone number"),
  email: z.email("Invalid email"),
  password,
});

export const forgotSchema = z.object({ email: z.email("Invalid email") });

export const resetSchema = z.object({ password });
