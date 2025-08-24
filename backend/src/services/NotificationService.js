import Notification from '../models/Notification.js';
import RoleNotificationSetting from '../models/RoleNotificationSetting.js';
import { getIO } from './socket.service.js';

class NotificationService {
  static async dispatchEvent(eventType, content, targetUserId = null) {
    try {
      // If targeting a specific user
      if (targetUserId) {
        const notif = await Notification.create({ userId: targetUserId, eventType, content });
        // Best-effort socket emit to user room
        try {
          const io = getIO();
          io.to(`user_${targetUserId}`).emit('notification', { id: notif._id, eventType, content, createdAt: notif.createdAt });
  } catch { /* socket not initialized or room missing */ }
        return;
      }
      // Broadcast to roles based on settings
      const settings = await RoleNotificationSetting.find({ eventType, isEnabled: true });
      for (const s of settings) {
        const notif = await Notification.create({ role: s.role, eventType, content });
        // Optionally emit to a role room if clients join such rooms
        try {
          const io = getIO();
          io.to(`role_${s.role}`).emit('notification', { id: notif._id, eventType, content, role: s.role, createdAt: notif.createdAt });
  } catch { /* ignore socket errors */ }
      }
    } catch (err) {
      console.log('Notification dispatch error:', err);
    }
  }

  static async getUserNotifications(userId) {
    // Fetch both direct and role notifications
    return Notification.find({
      $or: [ { userId }, { role: { $in: ['patient','doctor','admin'] } } ],// filter by role membership in real app
      isRead: false
    }).sort({ createdAt: -1 });
  }

  static async markAsRead(notificationId) {
    return Notification.findByIdAndUpdate(notificationId, { isRead: true }, { new: true });
  }
}

export default NotificationService;
