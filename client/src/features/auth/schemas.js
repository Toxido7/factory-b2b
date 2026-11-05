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

const decimalString = (message, { min, max, positive = false } = {}) =>
  z
    .string()
    .trim()
    .min(1, message)
    .refine((value) => {
      const normalized = value.replace(',', '.');
      if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return false;
      const number = Number(normalized);
      return Number.isFinite(number)
        && (!positive || number > 0)
        && (min === undefined || number >= min)
        && (max === undefined || number <= max);
    }, message);

const optionalDecimalString = (message, options) =>
  z
    .string()
    .trim()
    .refine((value) => {
      if (!value) return true;
      return decimalString(message, options).safeParse(value).success;
    }, message);

export const productSchema = z.object({
  sku: z.string().trim().min(1, 'adminProductForm.skuRequired').max(50, 'adminProductForm.skuRequired'),
  name: z.string().trim().min(2, 'adminProductForm.nameLength').max(150, 'adminProductForm.nameLength'),
  description: z.string().trim().max(5000, 'adminProductForm.descriptionTooLong').optional(),
  categoryId: z.string().min(1, 'adminProductForm.categoryRequired'),
  price: decimalString('adminProductForm.invalidPrice', {
    max: 99999999.99,
    positive: true,
  }),
  minQuantity: z
    .string()
    .trim()
    .refine((value) => {
      if (!value) return true;
      return /^\d+$/.test(value) && Number(value) >= 1 && Number(value) <= 1000000;
    }, 'adminProductForm.invalidMinQuantity'),
  discountPercent: optionalDecimalString('adminProductForm.invalidDiscount', {
    min: 0,
    max: 100,
  }),
});

export function productFormToApi(values) {
  return {
    sku: values.sku.trim(),
    name: values.name.trim(),
    description: values.description.trim() || undefined,
    categoryId: values.categoryId,
    price: Number(values.price.replace(',', '.')),
    minQuantity: values.minQuantity ? Number(values.minQuantity) : undefined,
    discountPercent: values.discountPercent ? Number(values.discountPercent.replace(',', '.')) : undefined,
  };
}

export const forgotSchema = z.object({ email: z.email("validation.emailInvalid") });

export const resetSchema = z.object({ password });
