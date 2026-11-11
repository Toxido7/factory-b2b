import { prisma } from '../../config/prisma.js';

export const findAll = () => prisma.siteContent.findMany({ orderBy: { key: 'asc' } });

export const applyChanges = (changes) =>
  prisma.$transaction(async (tx) => {
    for (const [key, value] of Object.entries(changes)) {
      if (value === '') {
        await tx.siteContent.deleteMany({ where: { key } });
      } else {
        await tx.siteContent.upsert({
          where: { key },
          update: { value },
          create: { key, value },
        });
      }
    }
  });
