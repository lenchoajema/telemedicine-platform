import mongoose from 'mongoose';

const invoiceItemSchema = new mongoose.Schema({
  serviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'ServiceCatalog' },
  description: { type: String },
  qty: { type: Number, default: 1 },
  unitPrice: { type: Number, default: 0 },
  taxRate: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
}, { _id: false });

const invoiceSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  familyId: { type: mongoose.Schema.Types.ObjectId, ref: 'FamilyGroup', index: true },
  subscriptionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subscription', index: true },
  status: { type: String, enum: ['Draft','Open','Paid','PastDue','Canceled'], default: 'Draft', index: true },
  dueAt: { type: Date },
  paidAt: { type: Date },
  amountDue: { type: Number, default: 0 },
  currency: { type: String, default: 'USD' },
  items: [invoiceItemSchema],
}, { timestamps: true });

invoiceSchema.index({ userId: 1, createdAt: -1 });

const Invoice = mongoose.model('Invoice', invoiceSchema);
export default Invoice;
