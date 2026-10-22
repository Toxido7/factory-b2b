import { prisma } from '../../config/prisma.js';

// The only fields that are safe to send to a client (never passwordHash)
const publicUserSelect = {
  id: true,
  email: true,
  fullName: true,
  companyName: true,
  phone: true,
  role: true,
  emailVerified: true,
  createdAt: true,
};

export const findByEmail = (email) => prisma.user.findUnique({ where: { email } });

export const create = (data) => prisma.user.create({ data, select: publicUserSelect });
export const findById = (id) => prisma.user.findUnique({ where: { id } });
export const createAdmin = ({ email, passwordHash, fullName }) =>
  prisma.user.create({
    data: { email, passwordHash, fullName, role: 'ADMIN', emailVerified: true },
  });
const adminUserSelect = {
  id: true,
  email: true,
  fullName: true,
  companyName: true,
  phone: true,
  role: true,
  isActive: true,
  emailVerified: true,
  createdAt: true,
  updatedAt: true,
  _count: { select: { requests: true } },
};

export const findManyForAdmin = ({ where, skip, take }) =>
  prisma.$transaction([
    prisma.user.findMany({
      where,
      select: adminUserSelect,
      orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
      skip,
      take,
    }),
    prisma.user.count({ where }),
  ]);

export const findByIdForAdmin = (id) =>
  prisma.user.findUnique({ where: { id }, select: adminUserSelect });

export const setActive = (id, isActive) =>
  prisma.$transaction(async (tx) => {
    const user = await tx.user.update({
      where: { id },
      data: { isActive },
      select: adminUserSelect,
    });
    if (!isActive) {
      await tx.refreshToken.updateMany({
        where: { userId: id, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }
    return user;
  });
export const countActiveAdminsExcept = (id) =>
  prisma.user.count({ where: { role: 'ADMIN', isActive: true, id: { not: id } } });

export const setRole = (id, role) =>
  prisma.$transaction(async (tx) => {
    const user = await tx.user.update({
      where: { id },
      data: { role },
      select: adminUserSelect,
    });
    await tx.refreshToken.updateMany({
      where: { userId: id, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return user;
  });

export const revokeAllSessions = (userId) =>
  prisma.refreshToken.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });

export const updatePasswordAndRevokeSessions = (userId, passwordHash) =>
  prisma.$transaction([
    prisma.user.update({ where: { id: userId }, data: { passwordHash } }),
    prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    }),
  ]);
