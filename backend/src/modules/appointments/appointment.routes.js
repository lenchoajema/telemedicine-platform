import express from 'express';
import {
    createAppointment,
    getUpcomingAppointments,
    getAppointmentStats,
    getAvailableSlots,
    getAppointmentsByDate,
    cancelAppointment
} from './appointment.controller.js';
import authMiddleware from '../shared/middleware/auth.js';

const router = express.Router();

// Protect all appointment routes with auth
router.use(authMiddleware);

router.post('/', createAppointment);
router.get('/upcoming', getUpcomingAppointments);
router.get('/stats', getAppointmentStats);
router.get('/available-slots', getAvailableSlots);
router.get('/by-date', getAppointmentsByDate);
router.put('/:id/cancel', cancelAppointment);

export default router;
