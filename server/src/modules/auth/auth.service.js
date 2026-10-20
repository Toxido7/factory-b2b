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

const newRefreshToken = (userId, { userAgent, ip } = {}) => {
  const token = generateRefreshToken();

  return {
    token,
    record: {
      userId,
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + env.REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1000),
      userAgent: userAgent?.slice(0, 255),
      ip,
    },
  };
};

const issueRefreshToken = async (userId, meta) => {
  const { token, record } = newRefreshToken(userId, meta);
  await refreshTokensRepository.create(record);
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
export const refresh = async (rawToken, meta = {}) => {
  if (!rawToken) {
    throw ApiError.unauthorized('Missing refresh token');
  }

  const stored = await refreshTokensRepository.findByHash(hashToken(rawToken));
  if (!stored) {
    throw ApiError.unauthorized('Invalid refresh token');
  }

  // Already used or cancelled: someone is replaying an old token (possible theft)
  if (stored.revokedAt) {
    await refreshTokensRepository.revokeAllForUser(stored.userId);
    throw ApiError.unauthorized('Invalid refresh token');
  }

  if (stored.expiresAt <= new Date()) {
    throw ApiError.unauthorized('Refresh token expired');
  }

  if (!stored.user.isActive) {
    await refreshTokensRepository.revokeAllForUser(stored.userId);
    throw ApiError.forbidden('Account disabled');
  }

  const { token, record } = newRefreshToken(stored.userId, meta);
  const rotated = await refreshTokensRepository.rotate(stored.id, record);

  // Someone else used this exact token a split second before us: treat it as reuse
  if (!rotated) {
    await refreshTokensRepository.revokeAllForUser(stored.userId);
    throw ApiError.unauthorized('Invalid refresh token');
  }

  return {
    user: toPublicUser(stored.user),
    accessToken: signAccessToken(stored.user),
    refreshToken: token,
  };
};
export const logout = async (rawToken) => {
  if (!rawToken) return;
  await refreshTokensRepository.revokeByHash(hashToken(rawToken));
};
export const getMe = async (userId) => {
  const user = await usersRepository.findById(userId);

  if (!user || !user.isActive) {
    throw ApiError.unauthorized('Authentication required');
  }

  return toPublicUser(user);
};
