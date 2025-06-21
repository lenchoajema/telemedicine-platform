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
import { 
  getDoctorAvailability,
  setDoctorAvailability,
  deleteDoctorAvailability,
  getMyPatients,
  getDoctorAvailabilityById
} from './doctors.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { checkRole } from '../../middleware/authorization.middleware.js';

const router = express.Router();

// Public routes
router.get('/', getAllDoctors);
router.get('/specializations', getSpecializations);
router.get('/availability', getDoctorAvailabilityById); // Public route for patients to query availability

// Protected routes that require authentication for all routes below
router.use(authenticate);

// All authenticated routes go here (before the /:id wildcard route)
router.get('/stats', getDoctorStats);
router.get('/profile', getDoctorProfile);
router.get('/my-availability', checkRole(['doctor']), getDoctorAvailability); // Renamed to avoid conflict
router.post('/availability', checkRole(['doctor']), setDoctorAvailability);
router.delete('/availability/:day', checkRole(['doctor']), deleteDoctorAvailability);
router.get('/my-patients', checkRole(['doctor']), getMyPatients);

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