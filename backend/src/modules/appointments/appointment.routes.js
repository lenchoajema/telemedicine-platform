import express from 'express';
import { 
  getAppointments,
  getAppointmentById,
  createAppointment,
  updateAppointment,
  rescheduleAppointment,
  deleteAppointment,
  getAppointmentStats,
  getUpcomingAppointments,
  getAvailableSlots
} from './appointment.controller.js';
import authenticate from '../shared/middleware/auth.js';
import mongoose from 'mongoose';

const router = express.Router();

// Middleware to validate ObjectId for routes with :id parameter
const validateObjectId = (req, res, next) => {
  if (!req.params.id || !mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ error: 'Invalid appointment ID format' });
  }
  next();
};

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
router.get('/:id', validateObjectId, getAppointmentById);

// Create a new appointment
router.post('/', createAppointment);

// Update an appointment
router.put('/:id', validateObjectId, updateAppointment);

// Cancel an appointment
router.delete('/:id', validateObjectId, deleteAppointment);

// Reschedule an appointment
router.put('/:id/reschedule', validateObjectId, rescheduleAppointment);

export default router;