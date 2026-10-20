import { hashPassword } from '../../utils/password.js';
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
