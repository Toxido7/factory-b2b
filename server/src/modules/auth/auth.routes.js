import { Router } from 'express';
import { validate } from '../../middlewares/validate.js';
import {
  registerSchema,
  loginSchema,
  verifyEmailSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from './auth.schema.js';
import { authenticate } from '../../middlewares/authenticate.js';
import {
  loginLimiter,
  registerLimiter,
  refreshLimiter,
  resendVerificationLimiter,
  forgotPasswordLimiter,
  resetPasswordLimiter,
} from '../../middlewares/rateLimiters.js';
import * as authController from './auth.controller.js';

const router = Router();

router.post('/register', registerLimiter, validate(registerSchema), authController.register);
router.post('/login', loginLimiter, validate(loginSchema), authController.login);
router.post('/refresh', refreshLimiter, authController.refresh);
router.post('/logout', authController.logout);
router.post('/verify-email', validate(verifyEmailSchema), authController.verifyEmail);
router.post(
  '/resend-verification',
  resendVerificationLimiter,
  authenticate,
  authController.resendVerification,
);
router.post(
  '/forgot-password',
  forgotPasswordLimiter,
  validate(forgotPasswordSchema),
  authController.forgotPassword,
);
router.post(
  '/reset-password',
  resetPasswordLimiter,
  validate(resetPasswordSchema),
  authController.resetPassword,
);
router.get('/me', authenticate, authController.me);
export default router;
