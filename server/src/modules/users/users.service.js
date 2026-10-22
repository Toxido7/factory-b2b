import { hashPassword } from '../../utils/password.js';
import { ApiError } from '../../utils/ApiError.js';
import * as usersRepository from './users.repository.js';

export const createAdmin = async ({ email, password, fullName }) => {
  const existing = await usersRepository.findByEmail(email);
  if (existing) {
    return { created: false, user: existing };
  }

  const passwordHash = await hashPassword(password);
  const user = await usersRepository.createAdmin({ email, passwordHash, fullName });
  return { created: true, user };
};

// _count.requests -> requestCount (flat, easier for the frontend)
const toAdminUser = ({ _count, ...user }) => ({ ...user, requestCount: _count.requests });

export const listUsers = async ({ page, limit, q, isActive, role }) => {
  const where = {
    ...(isActive !== undefined && { isActive }),
    ...(role && { role }),
    ...(q && {
      OR: [
        { fullName: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
        { companyName: { contains: q, mode: 'insensitive' } },
      ],
    }),
  };
  const [users, total] = await usersRepository.findManyForAdmin({
    where,
    skip: (page - 1) * limit,
    take: limit,
  });
  return {
    users: users.map(toAdminUser),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
};

export const getUser = async (id) => {
  const user = await usersRepository.findByIdForAdmin(id);
  if (!user) throw ApiError.notFound('User not found');
  return toAdminUser(user);
};

export const setUserStatus = async ({ id, isActive, adminId }) => {
  if (id === adminId && !isActive) {
    throw ApiError.badRequest('You cannot disable your own account');
  }
  await getUser(id); // 404 if unknown
  return toAdminUser(await usersRepository.setActive(id, isActive));
};
