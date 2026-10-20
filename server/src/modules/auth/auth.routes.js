import { Router } from 'express';
import { validate } from '../../middlewares/validate.js';
import { registerSchema, loginSchema } from './auth.schema.js';
import { authenticate } from '../../middlewares/authenticate.js';
import * as authController from './auth.controller.js';

const router = Router();

router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);

router.get('/me', authenticate, authController.me);
export default router;
