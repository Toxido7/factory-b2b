import { Router } from 'express';
import { validate } from '../../middlewares/validate.js';
import * as controller from './users.controller.js';
import { listUsersSchema, userIdSchema, setStatusSchema } from './users.schema.js';

const router = Router();

router.get('/', validate(listUsersSchema), controller.list);
router.get('/:id', validate(userIdSchema), controller.getOne);
router.patch('/:id/status', validate(setStatusSchema), controller.setStatus);

export default router;
