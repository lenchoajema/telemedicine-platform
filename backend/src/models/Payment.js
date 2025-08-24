import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true, required: true },
  familyId: { type: mongoose.Schema.Types.ObjectId, ref: 'FamilyGroup', index: true },
  appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment', index: true },
  invoiceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice', index: true },
  paymentIntentId: { type: mongoose.Schema.Types.ObjectId, ref: 'PaymentIntent', index: true },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'USD' },
  method: { type: String, enum: ['Card','Bank','MobileWallet','Insurance','Cash','Other'], default: 'Card' },
  provider: { type: String, trim: true },
  channel: { type: String, enum: ['Web','Mobile','POS','Other'], default: 'Web' },
  status: { type: String, enum: ['Pending','Succeeded','Failed','Canceled','Refunded'], default: 'Pending', index: true },
  feeAmount: { type: Number, default: 0 },
  netAmount: { type: Number, default: 0 },
  receiptUrl: { type: String },
  providerRef: { type: String, index: true },
  settledAt: { type: Date },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
}, { timestamps: true });

paymentSchema.index({ userId: 1, createdAt: -1 });

const Payment = mongoose.model('Payment', paymentSchema);
export default Payment;
