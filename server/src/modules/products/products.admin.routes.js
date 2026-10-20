import { Router } from 'express';
import { validate } from '../../middlewares/validate.js';
import * as productsController from './products.controller.js';
import { createProductSchema, idParamsSchema, updateProductSchema } from './products.schema.js';

const router = Router();

router.get('/', productsController.listAdmin);
router.get('/:id', validate(idParamsSchema), productsController.getAdmin);
router.post('/', validate(createProductSchema), productsController.create);
router.patch('/:id', validate(updateProductSchema), productsController.update);

export default router;
