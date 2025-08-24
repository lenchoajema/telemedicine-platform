import mongoose from 'mongoose';

const claimLineItemSchema = new mongoose.Schema({
  serviceCode: { type: String },
  diagnosisCode: { type: String },
  units: { type: Number, default: 1 },
  price: { type: Number, default: 0 },
  modifiers: { type: mongoose.Schema.Types.Mixed, default: {} },
}, { _id: false });

const claimSchema = new mongoose.Schema({
  appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment', index: true },
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  payerId: { type: mongoose.Schema.Types.ObjectId, ref: 'InsuranceProvider', index: true },
  policyNumber: { type: String },
  status: { type: String, enum: ['Prepared','Submitted','Acknowledged','Paid','Denied'], default: 'Prepared', index: true },
  amountBilled: { type: Number, default: 0 },
  amountApproved: { type: Number, default: 0 },
  patientResponsibility: { type: Number, default: 0 },
  rawRequest: { type: mongoose.Schema.Types.Mixed, default: {} },
  rawResponse: { type: mongoose.Schema.Types.Mixed, default: {} },
  submittedAt: { type: Date },
  updatedAt: { type: Date },
  lineItems: [claimLineItemSchema],
}, { timestamps: true });

const Claim = mongoose.model('Claim', claimSchema);
export default Claim;
