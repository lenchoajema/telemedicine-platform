import express from 'express';
import { 
  getAllDoctors, 
  getDoctorById, 
  getDoctorAvailability,
  setDoctorAvailability,
  getDoctorStats,
  submitVerification,
  getMyPatients
} from './doctors.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { checkRole } from '../../middleware/authorization.middleware.js';

const router = express.Router();

// Public routes
router.get('/', getAllDoctors);
router.get('/:id', getDoctorById);

// Protected routes
router.use(authenticate);
router.get('/stats', checkRole(['doctor']), getDoctorStats);
router.get('/availability', checkRole(['doctor']), getDoctorAvailability);
router.post('/availability', checkRole(['doctor']), setDoctorAvailability);
router.post('/verification', checkRole(['doctor']), submitVerification);
router.get('/my-patients', checkRole(['doctor']), getMyPatients);

export default router;