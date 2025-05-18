import express from 'express';
import { authenticate } from '../../middleware/auth.middleware.js';
import { checkRole } from '../../middleware/authorization.middleware.js';
import { getMedicalRecords, getMedicalRecordById, createMedicalRecord, updateMedicalRecord } from './medical-records.controller.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Get all medical records (accessible to patients and doctors)
router.get('/', getMedicalRecords);

// Get a specific medical record by ID
router.get('/:id', getMedicalRecordById);

// Create a new medical record (only doctors can create records)
router.post('/', checkRole(['doctor']), createMedicalRecord);

// Update an existing medical record (only doctors can update records)
router.put('/:id', checkRole(['doctor']), updateMedicalRecord);

export default router;
