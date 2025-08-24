import mongoose from 'mongoose';

const RoleNotificationSettingSchema = new mongoose.Schema({
  role: { type: String, enum: ['patient','doctor','admin'], required: true },
  eventType: { type: String, required: true },
  isEnabled: { type: Boolean, default: true }
});

RoleNotificationSettingSchema.index({ role: 1, eventType: 1 }, { unique: true });

const RoleNotificationSettingModel = mongoose.models.RoleNotificationSetting || mongoose.model('RoleNotificationSetting', RoleNotificationSettingSchema);
export default RoleNotificationSettingModel;
