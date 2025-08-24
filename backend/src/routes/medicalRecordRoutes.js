import express from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorizePrivilege, attachUserPrivileges } from '../middleware/rbac.middleware.js';
import {
  createMedicalRecord,
  getMedicalRecords,
  getMedicalRecordById,
  updateMedicalRecord
} from '../modules/patients/medical-records.controller.js';

const router = express.Router();

// Protect all routes. Important: we call authenticate here so this router can be mounted
// standalone if needed. Because authenticate re-hydrates req.user it will wipe any
// privileges previously attached at the app level. Therefore we immediately re-run
// attachUserPrivileges to ensure req.user.privileges is present for authorizePrivilege.
router.use(authenticate, attachUserPrivileges);

// @desc    Get medical records for the logged-in user (patient or doctor or admin)
// @route   GET /api/medical-records
// @access  Private
router.get('/', getMedicalRecords);

// @desc    Get a specific medical record by ID
// @route   GET /api/medical-records/:id
// @access  Private
router.get('/:id', getMedicalRecordById);

// @desc    Create a new medical record
// @route   POST /api/medical-records
// @access  Private, requires Create/Edit Consultation Notes privilege
router.post('/', authorizePrivilege('Create/Edit Consultation Notes'), createMedicalRecord);

// @desc    Update an existing medical record
// @route   PUT /api/medical-records/:id
// @access  Private, requires Create/Edit Consultation Notes privilege
router.put('/:id', authorizePrivilege('Create/Edit Consultation Notes'), updateMedicalRecord);

export default router;