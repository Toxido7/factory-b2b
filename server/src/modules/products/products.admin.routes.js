import { Router } from 'express';
import { validate } from '../../middlewares/validate.js';
import * as productsController from './products.controller.js';
import { uploadImage } from '../../middlewares/uploadImage.js';
import {
  createProductSchema,
  idParamsSchema,
  updateProductSchema,
  imageUploadParamSchema,
  imageDeleteParamSchema,
} from './products.schema.js';

const router = Router();

router.get('/', productsController.listAdmin);
router.get('/:id', validate(idParamsSchema), productsController.getAdmin);
router.post('/', validate(createProductSchema), productsController.create);
router.patch('/:id', validate(updateProductSchema), productsController.update);

router.post(
  '/:id/images',
  validate(imageUploadParamSchema),
  uploadImage,
  productsController.addImage,
);
router.delete(
  '/:id/images/:filename',
  validate(imageDeleteParamSchema),
  productsController.removeImage,
);
export default router;
