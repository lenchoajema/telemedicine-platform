import mongoose from 'mongoose';

const paymentIntentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  quoteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quote', index: true },
  appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment', index: true },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'USD' },
  provider: { type: String, trim: true },
  method: { type: String, enum: ['Card','Bank','MobileWallet'], required: true },
  status: { type: String, enum: ['RequiresAction','Pending','Succeeded','Failed','Canceled'], default: 'Pending', index: true },
  clientSecret: { type: String },
  checkoutUrl: { type: String },
  providerRef: { type: String },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
}, { timestamps: true });

paymentIntentSchema.index({ userId: 1, createdAt: -1 });

const PaymentIntent = mongoose.model('PaymentIntent', paymentIntentSchema);
export default PaymentIntent;
