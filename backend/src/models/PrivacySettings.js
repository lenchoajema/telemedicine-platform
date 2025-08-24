import mongoose from 'mongoose';

const privacySettingsSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', unique: true, required: true, index: true },
  shareWithProviders: { type: Boolean, default: true },
  shareAnonymizedResearch: { type: Boolean, default: true },
  shareWithInsurance: { type: Boolean, default: false },
  publicProfileVisible: { type: Boolean, default: false },
  version: { type: Number, default: 0 },
}, { timestamps: true });

const PrivacySettings = mongoose.model('PrivacySettings', privacySettingsSchema);
export default PrivacySettings;
