import { ApiError } from '../../utils/ApiError.js';
import { hashPassword } from '../../utils/password.js';
import * as usersRepository from '../users/users.repository.js';

export const register = async ({ email, password, fullName, companyName, phone }) => {
  const existing = await usersRepository.findByEmail(email);
  if (existing) {
    throw ApiError.conflict('Email already registered');
  }

  const passwordHash = await hashPassword(password);

  return usersRepository.create({ email, passwordHash, fullName, companyName, phone });
};
