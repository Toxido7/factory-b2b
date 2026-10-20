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
