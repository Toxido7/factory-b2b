import { Router } from 'express';
import { validate } from '../../middlewares/validate.js';
import * as controller from './requests.controller.js';
import { createRequestSchema } from './requests.schema.js';
import { createRequestLimiter } from '../../middlewares/rateLimiters.js';

const router = Router();

router.post('/', validate(createRequestSchema), controller.create);
router.post('/', createRequestLimiter, validate(createRequestSchema), controller.create);
export default router;
