import { ApiError } from '../../utils/ApiError.js';
import { hashPassword, verifyPassword } from '../../utils/password.js';
import { env } from '../../config/env.js';
import {
  signAccessToken,
  generateRefreshToken,
  generateUrlToken,
  hashToken,
} from '../../utils/tokens.js';
import { logger } from '../../config/logger.js';
import { sendEmail } from '../../utils/mailer.js';
import { verificationEmail, passwordResetEmail } from './auth.emails.js';
import * as refreshTokensRepository from './refreshTokens.repository.js';
import * as verificationTokensRepository from './verificationTokens.repository.js';
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
const EMAIL_VERIFY_HOURS = 24;

const sendVerificationEmail = async (user) => {
  const token = generateUrlToken();

  await verificationTokensRepository.create({
    userId: user.id,
    type: 'EMAIL_VERIFY',
    tokenHash: hashToken(token),
    expiresAt: new Date(Date.now() + EMAIL_VERIFY_HOURS * 60 * 60 * 1000),
  });

  const url = `${env.CLIENT_URL}/verify-email?token=${token}`;
  await sendEmail({ to: user.email, ...verificationEmail({ fullName: user.fullName, url }) });
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

  const user = await usersRepository.create({
    email,
    passwordHash,
    fullName,
    companyName,
    phone,
  });

  try {
    await sendVerificationEmail(user);
  } catch (err) {
    // The account exists. A failed email must not block the sign-up.
    logger.error({ err, userId: user.id }, 'Could not send verification email');
  }

  return user;
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
export const updateMe = async (userId, { fullName, companyName, phone }) => {
  const user = await usersRepository.findById(userId);

  if (!user || !user.isActive) {
    throw ApiError.unauthorized('Authentication required');
  }

  const updated = await usersRepository.updateProfile(userId, {
    fullName,
    companyName,
    phone,
  });
  return toPublicUser(updated);
};
export const verifyEmail = async (rawToken) => {
  const invalid = () => ApiError.badRequest('Invalid or expired verification link');

  const stored = await verificationTokensRepository.findByHash(hashToken(rawToken));

  if (
    !stored ||
    stored.type !== 'EMAIL_VERIFY' ||
    stored.usedAt ||
    stored.expiresAt <= new Date()
  ) {
    throw invalid();
  }

  const done = await verificationTokensRepository.consumeEmailVerification(
    stored.id,
    stored.userId,
  );
  if (!done) throw invalid();
};

export const resendVerification = async (userId) => {
  const user = await usersRepository.findById(userId);

  if (!user || !user.isActive) {
    throw ApiError.unauthorized('Authentication required');
  }
  if (user.emailVerified) {
    throw ApiError.conflict('Email is already verified');
  }

  await verificationTokensRepository.invalidateAllForUser(user.id, 'EMAIL_VERIFY');
  await sendVerificationEmail(user);
};
const PASSWORD_RESET_MINUTES = 60;

const sendPasswordResetEmail = async (user) => {
  const token = generateUrlToken();

  await verificationTokensRepository.create({
    userId: user.id,
    type: 'PASSWORD_RESET',
    tokenHash: hashToken(token),
    expiresAt: new Date(Date.now() + PASSWORD_RESET_MINUTES * 60 * 1000),
  });

  const url = `${env.CLIENT_URL}/reset-password?token=${token}`;
  await sendEmail({ to: user.email, ...passwordResetEmail({ fullName: user.fullName, url }) });
};
export const forgotPassword = async (email) => {
  const user = await usersRepository.findByEmail(email);
  if (!user || !user.isActive) return; // same silent answer as for a real account

  try {
    await verificationTokensRepository.invalidateAllForUser(user.id, 'PASSWORD_RESET');
    await sendPasswordResetEmail(user);
  } catch (err) {
    // Never tell the caller: success and failure must look identical
    logger.error({ err, userId: user.id }, 'Could not send password reset email');
  }
};

export const resetPassword = async ({ token, password }) => {
  const invalid = () => ApiError.badRequest('Invalid or expired reset link');

  const stored = await verificationTokensRepository.findByHash(hashToken(token));

  if (
    !stored ||
    stored.type !== 'PASSWORD_RESET' ||
    stored.usedAt ||
    stored.expiresAt <= new Date()
  ) {
    throw invalid();
  }

  const passwordHash = await hashPassword(password);
  const done = await verificationTokensRepository.consumePasswordReset(
    stored.id,
    stored.userId,
    passwordHash,
  );
  if (!done) throw invalid();
};
export const changePassword = async ({ userId, currentPassword, newPassword }) => {
  const user = await usersRepository.findById(userId);
  if (!user || !user.isActive) throw ApiError.unauthorized('Invalid or expired token');

  const ok = await verifyPassword(currentPassword, user.passwordHash);
  if (!ok) throw ApiError.badRequest('Current password is incorrect');
  if (currentPassword === newPassword) {
    throw ApiError.badRequest('New password must be different from the current one');
  }

  const passwordHash = await hashPassword(newPassword);
  await usersRepository.updatePasswordAndRevokeSessions(userId, passwordHash);
};

export const logoutAll = async (userId) => {
  await usersRepository.revokeAllSessions(userId);
};
// Old expired tokens are useless. Revoked-but-not-expired ones stay on purpose:
// replaying one must still raise the theft alarm.
export const cleanupExpiredTokens = async ({ olderThanDays = 7 } = {}) => {
  const cutoff = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000);
  const [refresh, verification] = await Promise.all([
    refreshTokensRepository.deleteExpiredBefore(cutoff),
    verificationTokensRepository.deleteExpiredBefore(cutoff),
  ]);
  return { refreshTokens: refresh.count, verificationTokens: verification.count };
};
