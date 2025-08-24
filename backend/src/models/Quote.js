import mongoose from 'mongoose';

const quoteItemSchema = new mongoose.Schema({
  serviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'ServiceCatalog' },
  serviceCode: { type: String },
  name: { type: String },
  qty: { type: Number, default: 1 },
  unitPrice: { type: Number, default: 0 },
  taxRate: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
}, { _id: false });

const quoteSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment', index: true },
  items: [quoteItemSchema],
  subtotal: { type: Number, default: 0 },
  taxes: { type: Number, default: 0 },
  estimatedInsurance: { type: Number, default: 0 },
  patientResponsibility: { type: Number, default: 0 },
  currency: { type: String, default: 'USD' },
  expiresAt: { type: Date },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
}, { timestamps: true });

quoteSchema.index({ patientId: 1, createdAt: -1 });

const Quote = mongoose.model('Quote', quoteSchema);
export default Quote;
