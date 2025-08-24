import express from 'express';
import { authenticate } from '../../middleware/auth.middleware.js';
import { scheduleReminder, getReminders, sendReminder, markAsRead } from './reminder.controller.js';

const router = express.Router();

router.use(authenticate);

// Schedule reminders
router.post('/schedule', scheduleReminder);
// Get reminders for a user
router.get('/:userId', getReminders);
// Send a reminder (mark sent/failed)
router.patch('/:notificationId/send', sendReminder);
// Mark a reminder as read
router.patch('/:notificationId/read', markAsRead);

export default router;
