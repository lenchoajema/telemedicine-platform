import mongoose from 'mongoose';

const LaboratorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  address: { type: String },
  city: { type: String },
  country: { type: String, uppercase: true, trim: true },
  phone: { type: String },
  ownerUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true, default: null },
  geoJSON: { type: mongoose.Schema.Types.Mixed, default: null },
  hoursJSON: { type: mongoose.Schema.Types.Mixed, default: null },
  verificationStatus: { type: String, enum: ['Pending', 'Verified', 'Rejected'], default: 'Pending' },
}, { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } });

LaboratorySchema.index({ name: 1, city: 1 });
LaboratorySchema.index({ verificationStatus: 1 });
try { LaboratorySchema.index({ geoJSON: '2dsphere' }); } catch { /* noop */ }

export default mongoose.model('Laboratory', LaboratorySchema);
