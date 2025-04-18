import express from 'express';
import { createAppointment } from './appointment.controller.js';
import authMiddleware from '../shared/middleware/auth.js';

const router = express.Router();

// Protect all appointment routes with auth
router.use(authMiddleware);

router.post('/', createAppointment);
// Add more routes as needed

export default router;