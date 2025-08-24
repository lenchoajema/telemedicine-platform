import express from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { checkRole } from '../middleware/authorization.middleware.js';
import {
  registerLaboratory,
  getMyLaboratory,
  updateMyLaboratory,
  listMyCatalog,
  upsertCatalogItems,
  listLabOrders,
  acceptLabOrder,
  uploadLabResults,
  completeLabOrder,
  rejectLabOrder,
} from '../services/laboratory.portal.controller.js';

const router = express.Router();

router.use(authenticate);
router.use(checkRole(['laboratory','admin']));

router.post('/register', registerLaboratory);
router.get('/me', getMyLaboratory);
router.put('/me', updateMyLaboratory);

router.get('/catalog', listMyCatalog);
router.post('/catalog', upsertCatalogItems);
router.get('/orders', listLabOrders);
router.patch('/orders/:labExamId/accept', acceptLabOrder);
router.post('/orders/:labExamId/results', uploadLabResults);
router.patch('/orders/:labExamId/complete', completeLabOrder);
router.patch('/orders/:labExamId/reject', rejectLabOrder);

export default router;
