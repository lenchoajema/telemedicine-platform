import mongoose from 'mongoose';

const insuranceSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  provider: { type: String, required: true, trim: true },
  planName: { type: String, trim: true },
  memberId: { type: String, trim: true },
  policyNumber: { type: String, trim: true },
  groupNumber: { type: String, trim: true },
  effectiveFrom: { type: Date },
  effectiveTo: { type: Date },
  isPrimary: { type: Boolean, default: false, index: true },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
}, { timestamps: true });

insuranceSchema.index({ userId: 1, isPrimary: 1 });

const Insurance = mongoose.model('Insurance', insuranceSchema);
export default Insurance;
