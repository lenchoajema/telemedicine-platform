import express from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import upload from '../services/upload.service.js';
import {
  createMedicalDocument,
  getMedicalDocuments,
} from '../modules/patients/medical-documents.controller.js';

const router = express.Router();

// Protect routes
router.use(authenticate);

// Upload a new medical document (patients only)
// POST /api/medical-documents/upload
router.post(
  '/upload',
  upload.single('file'),
  createMedicalDocument
);

// Get medical documents for current user
// GET /api/medical-documents
router.get('/', getMedicalDocuments);

export default router;
