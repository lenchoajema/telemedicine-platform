import express from 'express';
import {
  getDashboardOverview,
  getSystemLogs,
  createBackup,
  getBackupHistory,
  setMaintenanceMode,
  sendSystemAnnouncement,
  clearSystemCache,
  exportUserData
} from './dashboard.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { authorizeAdmin } from '../../middleware/authorization.middleware.js';

const router = express.Router();

// Apply authentication middleware
router.use(authenticate);

// Apply admin authorization middleware
router.use(authorizeAdmin);

// Dashboard overview
router.get('/overview', getDashboardOverview);

// System logs
router.get('/logs', getSystemLogs);

// Backup management
router.post('/backup', createBackup);
router.get('/backup/history', getBackupHistory);

// System maintenance
router.post('/maintenance', setMaintenanceMode);

// System announcements
router.post('/announcement', sendSystemAnnouncement);

// Cache management
router.post('/cache/clear', clearSystemCache);

// Data export
router.get('/export/users', exportUserData);

export default router;
