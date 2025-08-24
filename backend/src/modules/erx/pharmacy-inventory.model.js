import mongoose from 'mongoose';

const PharmacyInventorySchema = new mongoose.Schema({
  pharmacyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Pharmacy', required: true },
  // drugId links to a formulary entry when known; optional to support SKU-only items
  drugId: { type: mongoose.Schema.Types.ObjectId, ref: 'FormularyDrug' },
  sku: { type: String },
  batchNumber: { type: String },
  expiryDate: { type: Date },
  unitPrice: { type: Number, required: true },
  qtyOnHand: { type: Number, required: true, default: 0 },
  reorderLevel: { type: Number, required: true, default: 0 },
  visibility: { type: String, enum: ['Public', 'ProviderOnly', 'Hidden'], default: 'Public' },
}, { timestamps: true });

// Uniqueness: prefer drugId+batch when drugId exists; otherwise sku+batch
PharmacyInventorySchema.index({ pharmacyId: 1, drugId: 1, batchNumber: 1 }, { unique: true, sparse: true });
PharmacyInventorySchema.index({ pharmacyId: 1, sku: 1, batchNumber: 1 }, { unique: true, sparse: true });
PharmacyInventorySchema.index({ pharmacyId: 1, visibility: 1 });

export default mongoose.model('PharmacyInventory', PharmacyInventorySchema);
