import mongoose from 'mongoose';

const NotificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  role: { type: String, enum: ['patient','doctor','admin'], default: null },
  eventType: { type: String, required: true },
  content: { type: String, required: true },
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

NotificationSchema.index({ userId: 1, role: 1, isRead: 1, createdAt: -1 });

const NotificationModel = mongoose.models.Notification || mongoose.model('Notification', NotificationSchema);
export default NotificationModel;
