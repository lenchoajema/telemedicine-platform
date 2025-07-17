import express from 'express';
import AuditService from '../../services/AuditService.js';
import { authenticateToken, authorizeRole } from '../../middleware/auth.js';

const router = express.Router();

// Get audit logs (Admin only)
router.get('/audit-logs', authenticateToken, authorizeRole(['admin']), async (req, res) => {
  try {
    const {
      userId,
      resourceType,
      resourceId,
      action,
      startDate,
      endDate,
      page = 1,
      limit = 50
    } = req.query;

    const filters = {};
    if (userId) filters.userId = userId;
    if (resourceType) filters.resourceType = resourceType;
    if (resourceId) filters.resourceId = resourceId;
    if (action) filters.action = action;
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;

    const skip = (page - 1) * limit;
    const result = await AuditService.getAuditLogs(filters, parseInt(limit), skip);

    res.json({
      success: true,
      logs: result.logs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: result.total,
        pages: Math.ceil(result.total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
});

// Get resource history (Admin and resource owner)
router.get('/audit-logs/resource/:resourceType/:resourceId', authenticateToken, async (req, res) => {
  try {
    const { resourceType, resourceId } = req.params;
    const { user } = req;

    // Check permissions
    if (user.role !== 'admin') {
      // For non-admin users, only allow viewing logs for their own resources
      if (resourceType === 'appointment') {
        const appointment = await Appointment.findById(resourceId);
        if (!appointment || (appointment.patient.toString() !== user._id.toString() && appointment.doctor.toString() !== user._id.toString())) {
          return res.status(403).json({ error: 'Access denied' });
        }
      }
      // Add similar checks for other resource types
    }

    const logs = await AuditService.getResourceHistory(resourceType, resourceId);
    res.json({ success: true, logs });
  } catch (error) {
    console.error('Error fetching resource history:', error);
    res.status(500).json({ error: 'Failed to fetch resource history' });
  }
});

// Get user activity (Admin or own activity)
router.get('/audit-logs/user/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const { user } = req;
    const { limit = 50 } = req.query;

    // Check permissions
    if (user.role !== 'admin' && user._id.toString() !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const logs = await AuditService.getUserActivity(userId, parseInt(limit));
    res.json({ success: true, logs });
  } catch (error) {
    console.error('Error fetching user activity:', error);
    res.status(500).json({ error: 'Failed to fetch user activity' });
  }
});

export default router;
