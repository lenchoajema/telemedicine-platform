import mongoose from 'mongoose';

const securitySettingsSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', unique: true, required: true, index: true },
  twoFactorEnabled: { type: Boolean, default: false },
  twoFactorType: { type: String, enum: ['App','SMS','Email',null], default: null },
  lastPasswordChangeAt: { type: Date },
  version: { type: Number, default: 0 },
}, { timestamps: true });

const SecuritySettings = mongoose.model('SecuritySettings', securitySettingsSchema);
export default SecuritySettings;
