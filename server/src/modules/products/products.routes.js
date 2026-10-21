import { Router } from 'express';
import { validate } from '../../middlewares/validate.js';
import * as controller from './products.controller.js';
import { listPublicSchema, slugParamSchema } from './products.schema.js';

const router = Router();

router.get('/', validate(listPublicSchema), controller.listPublic);
router.get('/:slug', validate(slugParamSchema), controller.getPublic);

export default router;
