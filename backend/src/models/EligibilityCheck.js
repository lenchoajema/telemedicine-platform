import mongoose from 'mongoose';

const eligibilityCheckSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  payerId: { type: mongoose.Schema.Types.ObjectId, ref: 'InsuranceProvider', index: true },
  policyNumber: { type: String },
  serviceCodes: { type: [String], default: [] },
  outcome: { type: String, enum: ['Eligible','Ineligible','Unknown'], default: 'Unknown' },
  copay: { type: Number, default: 0 },
  coinsurance: { type: Number, default: 0 },
  deductibleRemaining: { type: Number, default: 0 },
  rawResponse: { type: mongoose.Schema.Types.Mixed, default: {} },
  checkedAt: { type: Date, default: Date.now },
}, { timestamps: true });

const EligibilityCheck = mongoose.model('EligibilityCheck', eligibilityCheckSchema);
export default EligibilityCheck;
