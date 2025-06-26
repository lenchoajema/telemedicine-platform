import express from 'express';
import { getAdminSettings, updateSettingsSection, resetSettings } from './settings.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { checkRole } from '../../middleware/authorization.middleware.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Apply admin role check middleware
router.use(checkRole('admin'));

// Get all admin settings
router.get('/', getAdminSettings);

// Update specific settings section (platform, users, notifications, payments, security)
router.put('/:section', updateSettingsSection);

// Reset all settings to defaults
router.post('/reset', resetSettings);

export default router;