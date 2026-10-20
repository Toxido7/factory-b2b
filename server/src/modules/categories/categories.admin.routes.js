import { Router } from 'express';
import { validate } from '../../middlewares/validate.js';
import * as categoriesController from './categories.controller.js';
import { createCategorySchema, updateCategorySchema } from './categories.schema.js';

const router = Router();

router.get('/', categoriesController.listAdmin);
router.post('/', validate(createCategorySchema), categoriesController.create);
router.patch('/:id', validate(updateCategorySchema), categoriesController.update);

export default router;
