import { cleanupExpiredTokens } from '../src/modules/auth/auth.service.js';
import { prisma } from '../src/config/prisma.js';

const days = Number(process.argv[2] ?? 7);
if (!Number.isFinite(days) || days < 0) {
  console.error('Usage: npm run tokens:cleanup -- [days]');
  process.exit(1);
}

const result = await cleanupExpiredTokens({ olderThanDays: days });
console.log(
  `Deleted ${result.refreshTokens} refresh token(s) and ${result.verificationTokens} verification token(s)`,
);
await prisma.$disconnect();
