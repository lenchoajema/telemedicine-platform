import mongoose from 'mongoose';

const priceBookItemSchema = new mongoose.Schema({
  serviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'ServiceCatalog', required: true },
  unitPrice: { type: Number, required: true },
  taxRate: { type: Number, default: 0 },
  discount: { type: mongoose.Schema.Types.Mixed, default: {} },
}, { _id: false });

const priceBookSchema = new mongoose.Schema({
  region: { type: String, required: true, uppercase: true, trim: true },
  payerType: { type: String, enum: ['SelfPay','Insurance','Corporate'], required: true },
  effectiveFrom: { type: Date, required: true },
  effectiveTo: { type: Date },
  items: [priceBookItemSchema],
  active: { type: Boolean, default: true },
}, { timestamps: true });

priceBookSchema.index({ region: 1, payerType: 1, effectiveFrom: -1 });
priceBookSchema.index({ region: 1, payerType: 1, effectiveTo: 1 });

const PriceBook = mongoose.model('PriceBook', priceBookSchema);
export default PriceBook;
