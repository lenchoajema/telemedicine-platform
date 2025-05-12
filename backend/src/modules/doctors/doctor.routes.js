import express from 'express';
import { 
  uploadDocument,
  submitVerification,
  getVerificationStatus,
  getAllDoctors,
  getSpecializations, 
  getDoctorById,
  rateDoctorById,
  getDoctorStats
  //rescheduleAppointment
} from './doctor.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';

const router = express.Router();

// Public routes
router.get('/', getAllDoctors);
router.get('/specializations', getSpecializations);
// Stats endpoint - requires authentication but defined before /:id to avoid path conflicts
router.get('/stats', authenticate, getDoctorStats);
router.get('/:id', getDoctorById);
// Rating endpoint - requires authentication
router.post('/:id/rate', authenticate, rateDoctorById);

// Protected routes
router.use(authenticate);

// Document upload route
router.post('/upload-document', uploadDocument);

// Verification submission route
router.post('/verify', submitVerification);

// Get verification status
router.get('/verification-status', getVerificationStatus);

export default router;