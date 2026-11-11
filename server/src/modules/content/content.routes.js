import { Router } from 'express';
import * as contentController from './content.controller.js';

const router = Router();

router.get('/', contentController.listPublic);

export default router;
