import { randomUUID } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { env } from '../config/env.js';

export const uploadDir = path.resolve(env.UPLOAD_DIR);

export const saveImage = async (buffer, ext) => {
  await fs.mkdir(uploadDir, { recursive: true });
  const filename = `${randomUUID()}.${ext}`;
  await fs.writeFile(path.join(uploadDir, filename), buffer);
  return filename;
};

// force: true = no error if the file is already gone
export const deleteImage = (filename) => fs.rm(path.join(uploadDir, filename), { force: true });
