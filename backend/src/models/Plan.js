import mongoose from 'mongoose';

const planSchema = new mongoose.Schema({
  name: { type: String, required: true },
  interval: { type: String, enum: ['month','quarter','year','Monthly','Quarterly','Annual'], required: true },
  price: { type: Number, required: true },
  currency: { type: String, default: 'USD' },
  includedVisits: { type: Number, default: 0 },
  overageRate: { type: Number, default: 0 },
  features: { type: mongoose.Schema.Types.Mixed, default: {} },
  active: { type: Boolean, default: true },
}, { timestamps: true });

const Plan = mongoose.model('Plan', planSchema);
export default Plan;
