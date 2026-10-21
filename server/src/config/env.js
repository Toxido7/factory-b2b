import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(3000),
  CLIENT_URL: z.string().url(),
  DATABASE_URL: z.string().url(),
  BCRYPT_ROUNDS: z.coerce.number().int().min(4).max(15).default(12),
  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must be at least 32 characters'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  REFRESH_TOKEN_DAYS: z.coerce.number().int().min(1).max(90).default(7),
  MAIL_HOST: z.string().default('localhost'),
  MAIL_PORT: z.coerce.number().int().default(1025),
  MAIL_SECURE: z
    .enum(['true', 'false'])
    .default('false')
    .transform((value) => value === 'true'),
  MAIL_USER: z.string().optional(),
  MAIL_PASS: z.string().optional(),
  MAIL_FROM: z.string().default('Factory Site <no-reply@factory.local>'),
  UPLOAD_DIR: z.string().min(1).default('uploads'),
  TEAM_EMAIL: z.string().email(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
