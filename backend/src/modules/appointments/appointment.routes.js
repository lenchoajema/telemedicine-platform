import express from 'express';
import { 
  getAppointments,
  getAppointmentById,
  createAppointment,
  updateAppointment,
  deleteAppointment,
  getAppointmentStats,
  getUpcomingAppointments,
  getAvailableSlots
} from './appointment.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Dashboard stats endpoint
router.get('/stats', getAppointmentStats);

// Upcoming appointments endpoint
router.get('/upcoming', getUpcomingAppointments);

// Available slots endpoint
router.get('/available-slots', getAvailableSlots);

// Get all appointments (filtered by user role)
router.get('/', getAppointments);

// Get a single appointment
router.get('/:id', getAppointmentById);

// Create a new appointment
router.post('/', createAppointment);

// Update an appointment
router.put('/:id', updateAppointment);

// Cancel an appointment
router.delete('/:id', deleteAppointment);

export default router;