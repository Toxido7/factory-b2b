import 'dotenv/config';
import { z } from 'zod';
import { prisma } from '../src/config/prisma.js';
import * as usersService from '../src/modules/users/users.service.js';

const schema = z.object({
  ADMIN_EMAIL: z.string().trim().toLowerCase().email(),
  ADMIN_PASSWORD: z.string().min(12, 'must be at least 12 characters').max(72),
  ADMIN_FULL_NAME: z.string().trim().min(1).default('Administrator'),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  console.error('Missing or invalid admin variables:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

const { ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_FULL_NAME } = parsed.data;

try {
  const { created } = await usersService.createAdmin({
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
    fullName: ADMIN_FULL_NAME,
  });

  console.log(
    created
      ? `Admin created: ${ADMIN_EMAIL}`
      : `A user with email ${ADMIN_EMAIL} already exists. Nothing changed.`,
  );
} finally {
  await prisma.$disconnect();
}
