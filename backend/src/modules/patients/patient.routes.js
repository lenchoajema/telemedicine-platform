import express from 'express';
import { getRecentDoctors } from './patient.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { checkRole } from '../../middleware/authorization.middleware.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Routes that require patient role
router.get('/recent-doctors', checkRole('patient'), getRecentDoctors);

export default router;
