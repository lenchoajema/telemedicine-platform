import mongoose from 'mongoose';

const subscriptionSchema = new mongoose.Schema({
  ownerUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true, required: true },
  familyId: { type: mongoose.Schema.Types.ObjectId, ref: 'FamilyGroup', index: true },
  planId: { type: mongoose.Schema.Types.ObjectId, ref: 'Plan', index: true, required: true },
  status: { type: String, enum: ['Active','PastDue','Canceled'], default: 'Active', index: true },
  currentPeriodStart: { type: Date },
  currentPeriodEnd: { type: Date },
  renewalAt: { type: Date },
  paymentMethodId: { type: mongoose.Schema.Types.ObjectId, ref: 'PaymentMethod' },
}, { timestamps: true });

const Subscription = mongoose.model('Subscription', subscriptionSchema);
export default Subscription;
