import { Router } from 'express';
import { validate } from '../../middlewares/validate.js';
import * as contentController from './content.controller.js';
import { updateContentSchema } from './content.schema.js';

const router = Router();

router.get('/', contentController.listAdmin);
router.patch('/', validate(updateContentSchema), contentController.update);

export default router;
