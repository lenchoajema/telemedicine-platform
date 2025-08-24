import ReminderNotification from './notification.model.js';
import { sendReminderEmail } from './services/emailService.js';
import { sendReminderSMS } from './services/smsService.js';
import { sendPushNotification } from './services/pushService.js';

/**
 * Dispatch pending reminders scheduled at or before now
 */
export async function dispatchReminders() {
  try {
    const now = new Date();
    const pending = await ReminderNotification.find({
      scheduledAt: { $lte: now },
      deliveryStatus: 'Pending'
    });
    for (const notif of pending) {
      try {
        const userId = notif.user.toString();
        switch (notif.channel) {
          case 'Email':
            await sendReminderEmail(userId, notif);
            break;
          case 'SMS':
            await sendReminderSMS(userId, notif);
            break;
          case 'Push':
            await sendPushNotification(userId, notif);
            break;
          case 'Dashboard':
            // Dashboard notifications are internal; nothing to send
            break;
          default:
            console.log(`Unknown channel ${notif.channel}`);
        }
        notif.sentAt = new Date();
        notif.deliveryStatus = 'Sent';
      } catch (err) {
        console.log('Error dispatching notification', err);
        notif.sentAt = new Date();
        notif.deliveryStatus = 'Failed';
      }
      await notif.save();
    }
  } catch (err) {
    console.log('Error in dispatchReminders', err);
  }
}
