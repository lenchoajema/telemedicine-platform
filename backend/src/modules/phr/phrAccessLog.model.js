import mongoose from 'mongoose';

const PHRAccessLogSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  actorUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  accessType: { type: String, enum: ['SelfView','Export','ShareLinkCreate','ShareLinkAccess','Revoke'], required: true },
  resourceScope: { type: String },
  resourceIds: { type: [String] },
  channel: { type: String },
  ipAddress: { type: String },
  userAgent: { type: String },
  correlationId: { type: String },
  createdAt: { type: Date, default: Date.now }
});

PHRAccessLogSchema.index({ patientId: 1, createdAt: -1 });

export default mongoose.models.PHRAccessLog || mongoose.model('PHRAccessLog', PHRAccessLogSchema);
