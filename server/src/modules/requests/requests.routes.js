import { Router } from 'express';
import { validate } from '../../middlewares/validate.js';
import { createRequestSchema, listMineSchema, requestIdParamSchema } from './requests.schema.js';
import { createRequestLimiter } from '../../middlewares/rateLimiters.js';
import * as controller from './requests.controller.js';

const router = Router();

router.post('/', validate(createRequestSchema), controller.create);
router.post('/', createRequestLimiter, validate(createRequestSchema), controller.create);
router.get('/mine', validate(listMineSchema), controller.listMine);
router.get('/mine/:id', validate(requestIdParamSchema), controller.getMine);

export default router;
