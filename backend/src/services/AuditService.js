import AuditLog from '../models/AuditLog.js';

class AuditService {
  static async log(userId, userRole, action, resourceType, resourceId, details = {}, changes = null, req = null) {
    try {
      const auditEntry = new AuditLog({
        userId,
        userRole,
        action,
        resourceType,
        resourceId,
        details,
        changes,
        ipAddress: req?.ip || req?.connection?.remoteAddress || 'unknown',
        userAgent: req?.get('User-Agent') || 'unknown'
      });

      await auditEntry.save();
      console.log(`Audit log created: ${action} by ${userRole} ${userId} on ${resourceType} ${resourceId}`);
    } catch (error) {
      console.error('Failed to create audit log:', error);
      // Don't throw error to avoid breaking main functionality
    }
  }

  static async getAuditLogs(filters = {}, limit = 100, skip = 0) {
    try {
      const query = {};
      
      if (filters.userId) query.userId = filters.userId;
      if (filters.resourceType) query.resourceType = filters.resourceType;
      if (filters.resourceId) query.resourceId = filters.resourceId;
      if (filters.action) query.action = filters.action;
      if (filters.startDate && filters.endDate) {
        query.timestamp = {
          $gte: new Date(filters.startDate),
          $lte: new Date(filters.endDate)
        };
      }

      const logs = await AuditLog.find(query)
        .populate('userId', 'profile.firstName profile.lastName email role')
        .sort({ timestamp: -1 })
        .limit(limit)
        .skip(skip);

      const total = await AuditLog.countDocuments(query);

      return { logs, total };
    } catch (error) {
      console.error('Failed to fetch audit logs:', error);
      throw error;
    }
  }

  static async getResourceHistory(resourceType, resourceId) {
    try {
      const logs = await AuditLog.find({
        resourceType,
        resourceId
      })
        .populate('userId', 'profile.firstName profile.lastName email role')
        .sort({ timestamp: -1 });

      return logs;
    } catch (error) {
      console.error('Failed to fetch resource history:', error);
      throw error;
    }
  }

  static async getUserActivity(userId, limit = 50) {
    try {
      const logs = await AuditLog.find({ userId })
        .sort({ timestamp: -1 })
        .limit(limit);

      return logs;
    } catch (error) {
      console.error('Failed to fetch user activity:', error);
      throw error;
    }
  }
}

export default AuditService;
