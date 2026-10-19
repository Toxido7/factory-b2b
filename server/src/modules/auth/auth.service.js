import { ApiError } from '../../utils/ApiError.js';
import { hashPassword, verifyPassword } from '../../utils/password.js';
import { env } from '../../config/env.js';
import { signAccessToken, generateRefreshToken, hashToken } from '../../utils/tokens.js';
import * as refreshTokensRepository from './refreshTokens.repository.js';
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

const issueRefreshToken = async (userId, { userAgent, ip }) => {
  const token = generateRefreshToken();
  const expiresAt = new Date(Date.now() + env.REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1000);

  await refreshTokensRepository.create({
    userId,
    tokenHash: hashToken(token),
    expiresAt,
    userAgent: userAgent?.slice(0, 255),
    ip,
  });

  return token;
};

export const login = async ({ email, password }, meta = {}) => {
  const user = await usersRepository.findByEmail(email);

  const passwordOk = await verifyPassword(password, user ? user.passwordHash : await dummyHash);

  if (!user || !passwordOk) {
    throw ApiError.unauthorized('Invalid email or password');
  }
  if (!user.isActive) {
    throw ApiError.forbidden('Account disabled');
  }

  return {
    user: toPublicUser(user),
    accessToken: signAccessToken(user),
    refreshToken: await issueRefreshToken(user.id, meta),
  };
};
export const register = async ({ email, password, fullName, companyName, phone }) => {
  const existing = await usersRepository.findByEmail(email);
  if (existing) {
    throw ApiError.conflict('Email already registered');
  }

  const passwordHash = await hashPassword(password);

  return usersRepository.create({ email, passwordHash, fullName, companyName, phone });
};
