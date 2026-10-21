import { prisma } from '../src/config/prisma.js';
import { retryUnsentEmails } from '../src/modules/requests/requests.service.js';

// optional argument: minimum age in minutes (default 5)
const minutes = Number(process.argv[2] ?? 5);

try {
  const result = await retryUnsentEmails({ olderThanMinutes: minutes });
  console.log(`Unsent: ${result.found}, sent now: ${result.sent}`);
} finally {
  await prisma.$disconnect();
}
