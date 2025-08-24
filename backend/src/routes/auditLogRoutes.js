import express from 'express';
import AuditService from '../services/AuditService.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = express.Router();

// Require authentication for audit log access
router.use(authenticate);

// GET /api/admin/audit-logs
// Supports paginated listing or resource-specific history
router.get('/', async (req, res) => {
  try {
    const { page, limit, userId, resourceType, resourceId, action, startDate, endDate } = req.query;
    // If no paging requested but resourceType and resourceId provided, return resource history
    if (!page && !limit && resourceType && resourceId) {
      const logs = await AuditService.getResourceHistory(resourceType, resourceId);
      return res.json({ success: true, logs });
    }
    // General paginated audit logs
    const pg = parseInt(page, 10) || 1;
    const lim = parseInt(limit, 10) || 50;
    const filters = {};
    if (userId) filters.userId = userId;
    if (resourceType) filters.resourceType = resourceType;
    if (resourceId) filters.resourceId = resourceId;
    if (action) filters.action = action;
    if (startDate && endDate) {
      filters.startDate = startDate;
      filters.endDate = endDate;
    }
    const skip = (pg - 1) * lim;
    const result = await AuditService.getAuditLogs(filters, lim, skip);
    return res.json({
      success: true,
      logs: result.logs,
      pagination: {
        total: result.total,
        page: pg,
        pages: Math.ceil(result.total / lim),
        limit: lim
      }
    });
  } catch (error) {
    console.log('Error fetching audit logs in route:', error);
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
});

export default router;
