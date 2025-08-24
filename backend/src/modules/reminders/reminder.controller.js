import ReminderNotification from './notification.model.js';
import Appointment from '../appointments/appointment.model.js';
// import external services (e.g., emailService, smsService, pushService)

// POST /api/reminders/schedule
export const scheduleReminder = async (req, res) => {
  const { appointmentId, channels, reminderTimes } = req.body;
  if (!appointmentId || !channels?.length || !reminderTimes?.length) {
    return res.status(400).json({ success: false, message: 'Missing parameters' });
  }
  try {
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) return res.status(404).json({ success: false, message: 'Appointment not found' });
    // Schedule for patient and doctor
    const users = [appointment.patient.toString(), appointment.doctor.toString()];
    const docs = [];
    users.forEach((userId) => {
      channels.forEach((channel) => {
        reminderTimes.forEach((time) => {
          docs.push({ user: userId, appointmentId, channel, scheduledAt: new Date(time), deliveryStatus: 'Pending' });
        });
      });
    });
    const created = await ReminderNotification.insertMany(docs);
    res.status(201).json({ success: true, data: created });
  } catch (error) {
    console.log('Error scheduling reminders:', error);
    res.status(500).json({ success: false, message: 'Failed to schedule reminders' });
  }
};

// GET /api/reminders/:userId
export const getReminders = async (req, res) => {
  try {
    // prevent client-side caching of reminders
    res.set('Cache-Control', 'no-store');
    const { userId } = req.params;
    console.log('getReminders called for userId:', userId);
    const reminders = await ReminderNotification.find({ user: userId })
      .populate('appointmentId', 'status date time')
      .sort({ scheduledAt: -1 });
    console.log('Fetched reminders count:', reminders.length);
    res.json({ success: true, data: reminders });
  } catch (error) {
    console.log('Error fetching reminders:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch reminders' });
  }
};

// PATCH /api/reminders/:notificationId/send
export const sendReminder = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const { deliveryStatus } = req.body; // 'Sent' or 'Failed'
    const notif = await ReminderNotification.findById(notificationId);
    if (!notif) return res.status(404).json({ success: false, message: 'Notification not found' });
    notif.deliveryStatus = deliveryStatus;
    notif.sentAt = new Date();
    await notif.save();
    res.json({ success: true, data: notif });
  } catch (error) {
    console.log('Error updating reminder:', error);
    res.status(500).json({ success: false, message: 'Failed to update reminder' });
  }
};
// PATCH /api/reminders/:notificationId/read - mark notification as read
export const markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const notif = await ReminderNotification.findById(notificationId);
    if (!notif) return res.status(404).json({ success: false, message: 'Notification not found' });
    notif.read = true;
    await notif.save();
    res.json({ success: true, data: notif });
  } catch (error) {
    console.log('Error marking notification read:', error);
    res.status(500).json({ success: false, message: 'Failed to mark as read' });
  }
};
