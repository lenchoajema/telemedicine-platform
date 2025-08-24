import mongoose from 'mongoose';

const notificationPreferencesSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', unique: true, required: true, index: true },
  appointmentReminders: { type: Boolean, default: true },
  emailGeneral: { type: Boolean, default: true },
  smsGeneral: { type: Boolean, default: false },
  medicationReminders: { type: Boolean, default: true },
  healthContent: { type: Boolean, default: true },
  marketing: { type: Boolean, default: false },
  version: { type: Number, default: 0 },
}, { timestamps: true });

const NotificationPreferences = mongoose.model('NotificationPreferences', notificationPreferencesSchema);
export default NotificationPreferences;
