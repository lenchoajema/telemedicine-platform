import express from 'express';
import { 
  getAppointments,
  getAppointmentById,
  createAppointment,
  updateAppointment,
  completeAppointment,
  rescheduleAppointment,
  cancelAppointment,
  getAppointmentStats,
  getUpcomingAppointments,
  getAvailableSlots
} from './appointment.controller.js';
// Corrected import path for the authentication middleware
import { authenticate } from '../../middleware/auth.middleware.js';
import { authorizePrivilege, attachUserPrivileges } from '../../middleware/rbac.middleware.js';
import mongoose from 'mongoose';

const router = express.Router();

// Middleware to validate ObjectId for routes with :id parameter
const validateObjectId = (req, res, next) => {
  if (!req.params.id || !mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ error: 'Invalid appointment ID format' });
  }
  next();
};

// Apply authentication + re-attach privileges (authenticate will overwrite req.user each time)
router.use(authenticate, attachUserPrivileges);

// --- Public or Role-Agnostic Routes (if any) ---

// --- Admin Only Routes ---
router.get('/stats', getAppointmentStats);

// --- Doctor/Patient Shared Routes ---
router.get('/', getAppointments); // Logic inside controller handles roles
router.get('/upcoming', getUpcomingAppointments);
router.get('/available-slots', getAvailableSlots);
router.get('/:id', validateObjectId, getAppointmentById);
router.post('/', createAppointment);
router.put('/:id', validateObjectId, updateAppointment);
router.delete('/:id', validateObjectId, cancelAppointment);
router.put('/:id/reschedule', validateObjectId, rescheduleAppointment);

// --- Doctor/Admin Routes and Privilege-Based Authorization ---
// Complete an appointment (requires Create/Edit Consultation Notes privilege)
router.put('/:id/complete', validateObjectId, authorizePrivilege('Create/Edit Consultation Notes'), completeAppointment);


export default router;