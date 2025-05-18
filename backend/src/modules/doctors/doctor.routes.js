import express from 'express';
import { 
  uploadDocument,
  submitVerification,
  getVerificationStatus,
  getAllDoctors,
  getSpecializations, 
  getDoctorById,
  rateDoctorById,
  getDoctorStats,
  getDoctorProfile
  //rescheduleAppointment
} from './doctor.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';

const router = express.Router();

// Public routes
router.get('/', getAllDoctors);
router.get('/specializations', getSpecializations);

// Protected routes that require authentication for all routes below
router.use(authenticate);

// All authenticated routes go here (before the /:id wildcard route)
router.get('/stats', getDoctorStats);
router.get('/profile', getDoctorProfile);

// Get doctor by ID - must be after all specific routes
router.get('/:id', getDoctorById);

// Rating endpoint - requires authentication
router.post('/:id/rate', rateDoctorById);

// Document upload route
router.post('/upload-document', uploadDocument);

// Verification submission route
router.post('/verify', submitVerification);

// Get verification status
router.get('/verification-status', getVerificationStatus);

export default router;