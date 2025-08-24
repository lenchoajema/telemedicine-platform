import mongoose from 'mongoose';

const paymentMethodSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  type: { type: String, enum: ['card', 'bank'], required: true },
  brand: { type: String, trim: true },
  last4: { type: String, trim: true },
  expMonth: { type: Number },
  expYear: { type: Number },
  billingName: { type: String, trim: true },
  billingAddress: { type: String, trim: true },
  city: { type: String, trim: true },
  state: { type: String, trim: true },
  postalCode: { type: String, trim: true },
  country: { type: String, trim: true },
  isDefault: { type: Boolean, default: false },
  provider: { type: String, trim: true },
  providerRef: { type: String, trim: true },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
}, { timestamps: true });

paymentMethodSchema.index({ userId: 1, isDefault: 1 });

const PaymentMethod = mongoose.model('PaymentMethod', paymentMethodSchema);
export default PaymentMethod;
