import multer from 'multer';
import { ApiError } from '../utils/ApiError.js';

const MAX_BYTES = 5 * 1024 * 1024;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_BYTES, files: 1 },
}).single('image'); // the form field must be called "image"

export const uploadImage = (req, res, next) => {
  upload(req, res, (err) => {
    if (!err) return next();
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE')
        return next(ApiError.badRequest('Image too large (max 5 MB)'));
      return next(ApiError.badRequest('Invalid upload'));
    }
    return next(err);
  });
};
