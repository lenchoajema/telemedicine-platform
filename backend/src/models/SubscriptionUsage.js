import mongoose from 'mongoose';

const subscriptionUsageSchema = new mongoose.Schema({
  subscriptionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subscription', index: true, required: true },
  appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment', index: true },
  units: { type: Number, default: 1 },
  recordedAt: { type: Date, default: Date.now },
}, { timestamps: true });

const SubscriptionUsage = mongoose.model('SubscriptionUsage', subscriptionUsageSchema);
export default SubscriptionUsage;
