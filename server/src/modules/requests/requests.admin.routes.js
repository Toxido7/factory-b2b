import { Router } from 'express';
import { validate } from '../../middlewares/validate.js';
import * as controller from './requests.controller.js';
import { listAdminSchema, requestIdParamSchema, changeStatusSchema } from './requests.schema.js';

const router = Router();

router.get('/', validate(listAdminSchema), controller.listAdmin);
router.get('/:id', validate(requestIdParamSchema), controller.getAdmin);
router.patch('/:id/status', validate(changeStatusSchema), controller.changeStatus);

export default router;
