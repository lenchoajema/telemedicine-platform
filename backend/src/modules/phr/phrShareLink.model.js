import mongoose from 'mongoose';
import crypto from 'crypto';

const PHRShareLinkSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  tokenHash: { type: String, required: true, unique: true },
  expiresAt: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  scope: { type: Object, required: true },
  usesRemaining: { type: Number },
  revokedAt: { type: Date },
  revokedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

PHRShareLinkSchema.index({ patientId: 1, expiresAt: 1 });

PHRShareLinkSchema.statics.generateToken = function() {
  return crypto.randomBytes(32).toString('hex');
};

export default mongoose.models.PHRShareLink || mongoose.model('PHRShareLink', PHRShareLinkSchema);
