import express from 'express';
import { 
  getPendingVerifications, 
  getVerificationDetails,
  approveVerification,
  rejectVerification
} from './verification.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { authorizeAdmin } from '../../middleware/authorization.middleware.js';

const router = express.Router();

// Apply authentication and admin-only middleware
router.use(authenticate);
router.use(authorizeAdmin);

// Get all pending verifications
router.get('/pending', getPendingVerifications);

// Get verification details for a specific doctor
router.get('/:doctorId', getVerificationDetails);

// Approve a doctor's verification
router.put('/:doctorId/approve', approveVerification);

// Reject a doctor's verification
router.put('/:doctorId/reject', rejectVerification);

export default router;
