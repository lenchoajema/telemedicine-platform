import mongoose from 'mongoose';

const PharmacyOrderSchema = new mongoose.Schema({
  pharmacyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Pharmacy', required: true },
  prescriptionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Prescription', required: true },
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['New', 'Accepted', 'ReadyForPickup', 'OutForDelivery', 'Dispensed', 'Rejected', 'Canceled'], default: 'New' },
  fulfillmentType: { type: String, enum: ['Pickup', 'Delivery'], required: true },
  totalPrice: { type: Number },
  notes: { type: String },
}, { timestamps: true });

PharmacyOrderSchema.index({ status: 1, pharmacyId: 1 });

export default mongoose.model('PharmacyOrder', PharmacyOrderSchema);
