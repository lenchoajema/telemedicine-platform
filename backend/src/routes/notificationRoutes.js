import express from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import NotificationService from '../services/NotificationService.js';

const router = express.Router();

// Get user notifications
router.get('/', authenticate, async (req, res) => {
  try {
    const notifications = await NotificationService.getUserNotifications(req.user._id);
    res.json({ success: true, notifications });
  } catch (err) {
    console.log('Error fetching notifications:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Mark notification as read
router.patch('/:id/read', authenticate, async (req, res) => {
  try {
    const notification = await NotificationService.markAsRead(req.params.id);
    res.json({ success: true, notification });
  } catch (err) {
    console.log('Error marking notification read:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

export default router;
