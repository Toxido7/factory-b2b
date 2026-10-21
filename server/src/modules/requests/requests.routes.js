import { Router } from 'express';
import { validate } from '../../middlewares/validate.js';
import * as controller from './requests.controller.js';
import { createRequestSchema } from './requests.schema.js';

const router = Router();

router.post('/', validate(createRequestSchema), controller.create);

export default router;
