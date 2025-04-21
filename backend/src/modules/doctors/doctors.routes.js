import express from 'express';
import { getAllDoctors, getDoctorById, getDoctorAvailability } from './doctors.controller.js';
import authMiddleware from '../shared/middleware/auth.js';

const router = express.Router();

router.get('/', getAllDoctors);
router.get('/availability', getDoctorAvailability);
router.get('/:id', getDoctorById);

export default router;