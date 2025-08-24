import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  appointmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment',
    required: true
  },
  channel: {
    type: String,
    enum: ['Push', 'SMS', 'Email', 'Dashboard'],
    required: true
  },
  scheduledAt: {
    type: Date,
    required: true
  },
  sentAt: {
    type: Date,
    default: null
  },
  deliveryStatus: {
    type: String,
    enum: ['Pending', 'Sent', 'Failed'],
    default: 'Pending'
  },
  read: {
    type: Boolean,
    default: false
  },
  payload: {
    type: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true
});

// Use a distinct model name to avoid conflicts
const ReminderNotification = mongoose.models.ReminderNotification || mongoose.model('ReminderNotification', notificationSchema);
export default ReminderNotification;
