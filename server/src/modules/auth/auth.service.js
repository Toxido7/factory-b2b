import { ApiError } from '../../utils/ApiError.js';
import { hashPassword, verifyPassword } from '../../utils/password.js';
import { signAccessToken } from '../../utils/tokens.js';
import * as usersRepository from '../users/users.repository.js';

// Used when the email doesn't exist, so the answer takes the same time either way
const dummyHash = hashPassword('not-a-real-password');

const toPublicUser = (user) => ({
  id: user.id,
  email: user.email,
  fullName: user.fullName,
  companyName: user.companyName,
  phone: user.phone,
  role: user.role,
  emailVerified: user.emailVerified,
  createdAt: user.createdAt,
});

export const login = async ({ email, password }) => {
  const user = await usersRepository.findByEmail(email);

  const passwordOk = await verifyPassword(password, user ? user.passwordHash : await dummyHash);

  if (!user || !passwordOk) {
    throw ApiError.unauthorized('Invalid email or password');
  }
  if (!user.isActive) {
    throw ApiError.forbidden('Account disabled');
  }

  return { user: toPublicUser(user), accessToken: signAccessToken(user) };
};
export const register = async ({ email, password, fullName, companyName, phone }) => {
  const existing = await usersRepository.findByEmail(email);
  if (existing) {
    throw ApiError.conflict('Email already registered');
  }

  const passwordHash = await hashPassword(password);

  return usersRepository.create({ email, passwordHash, fullName, companyName, phone });
};
