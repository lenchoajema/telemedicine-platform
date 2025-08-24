import mongoose from 'mongoose';

const ErxTransactionSchema = new mongoose.Schema({
  prescriptionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Prescription', required: true, index: true },
  type: { type: String, enum: ['New','Change','Cancel','Refill'], required: true },
  status: { type: String, enum: ['Queued','Sent','Failed'], default: 'Queued' },
  requestPayload: { type: mongoose.Schema.Types.Mixed },
  responsePayload: { type: mongoose.Schema.Types.Mixed },
  sentAt: { type: Date },
  ackAt: { type: Date },
  externalMessageId: { type: String },
}, { timestamps: true });

export default mongoose.model('ErxTransaction', ErxTransactionSchema);
