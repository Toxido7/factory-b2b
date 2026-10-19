import { prisma } from '../../src/config/prisma.js';

// Empties the tables, so every test starts from a clean database
export const resetDb = async () => {
  await prisma.user.deleteMany();
};
