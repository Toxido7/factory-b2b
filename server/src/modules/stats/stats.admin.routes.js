import { Router } from 'express';
import { validate } from '../../middlewares/validate.js';
import * as controller from './stats.controller.js';
import { rangeSchema, timeSeriesSchema, topSchema } from './stats.schema.js';

const router = Router();

router.get('/overview', validate(rangeSchema), controller.overview);
router.get('/requests-over-time', validate(timeSeriesSchema), controller.requestsOverTime);
router.get('/top-products', validate(topSchema), controller.topProducts);
router.get('/top-customers', validate(topSchema), controller.topCustomers);

export default router;
