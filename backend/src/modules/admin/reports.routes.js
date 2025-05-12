import express from 'express';
import { getReports, exportReportData } from './reports.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { authorizeAdmin } from '../../middleware/authorization.middleware.js';

const router = express.Router();

// Apply authentication middleware
router.use(authenticate);

// Apply admin authorization middleware
router.use(authorizeAdmin);

// Get reports data
router.get('/', getReports);

// Export report data
router.get('/:reportType/export', exportReportData);

export default router;
