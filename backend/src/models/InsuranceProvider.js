import mongoose from 'mongoose';

const insuranceProviderSchema = new mongoose.Schema({
  name: { type: String, required: true },
  country: { type: String },
  payerCode: { type: String },
  endpoint: { type: String },
  active: { type: Boolean, default: true },
}, { timestamps: true });

const InsuranceProvider = mongoose.model('InsuranceProvider', insuranceProviderSchema);
export default InsuranceProvider;
