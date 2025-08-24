import mongoose from 'mongoose';

const refundSchema = new mongoose.Schema({
  paymentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment', index: true, required: true },
  amount: { type: Number, required: true },
  reason: { type: String },
  providerRef: { type: String },
  status: { type: String, enum: ['Pending','Succeeded','Failed','Canceled'], default: 'Pending', index: true },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
}, { timestamps: true });

const Refund = mongoose.model('Refund', refundSchema);
export default Refund;
