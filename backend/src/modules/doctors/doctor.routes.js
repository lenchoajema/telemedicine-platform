import express from 'express';
import { 
  uploadDocument,
  submitVerification,
  getVerificationStatus,
  getAllDoctors
} from './doctor.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';

const router = express.Router();

// Public routes
router.get('/', getAllDoctors);

// Protected routes
router.use(authenticate);

// Document upload route
router.post('/upload-document', uploadDocument);

// Verification submission route
router.post('/verify', submitVerification);

// Get verification status
router.get('/verification-status', getVerificationStatus);

export default router;