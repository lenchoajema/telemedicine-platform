import express from 'express';
import { getAdminStats } from './stats.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { checkRole } from '../../middleware/authorization.middleware.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Apply admin role check middleware
router.use(checkRole('admin'));

// Admin stats endpoint
router.get('/', getAdminStats);

export default router;