import express from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { checkRole } from '../middleware/authorization.middleware.js';
import { createPrescription, sendPrescription, cancelPrescription, refillPrescription, listPharmacies, listPrescriptions, searchFormulary } from '../modules/erx/erx.controller.js';

const router = express.Router();

router.use(authenticate);

router.get('/pharmacies', listPharmacies);
router.get('/formulary', searchFormulary);
router.get('/prescriptions', listPrescriptions);
router.post('/prescriptions', checkRole(['doctor']), createPrescription);
router.post('/prescriptions/:id/send', checkRole(['doctor']), sendPrescription);
router.patch('/prescriptions/:id/cancel', checkRole(['doctor']), cancelPrescription);
router.post('/prescriptions/:id/refill', checkRole(['doctor']), refillPrescription);

export default router;
