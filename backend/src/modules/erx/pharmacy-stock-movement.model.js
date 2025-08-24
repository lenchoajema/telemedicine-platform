import mongoose from 'mongoose';

const PharmacyStockMovementSchema = new mongoose.Schema({
  pharmacyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Pharmacy', required: true },
  inventoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'PharmacyInventory' },
  type: { type: String, enum: ['Purchase', 'Adjustment', 'Dispense', 'Return', 'Loss'], required: true },
  qty: { type: Number, required: true },
  reason: { type: String },
  referenceType: { type: String, enum: ['Prescription', null], default: null },
  referenceId: { type: mongoose.Schema.Types.ObjectId, default: null },
  performedById: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: { createdAt: 'createdAt', updatedAt: false } });

PharmacyStockMovementSchema.index({ pharmacyId: 1, createdAt: -1 });

export default mongoose.model('PharmacyStockMovement', PharmacyStockMovementSchema);
