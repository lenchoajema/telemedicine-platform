import mongoose from 'mongoose';

const labOrderSchema = new mongoose.Schema({
  record: { type: mongoose.Schema.Types.ObjectId, ref: 'MedicalRecord', required: true },
  labTests: [{ type: String, required: true }],
  status: { type: String, enum: ['pending', 'completed', 'cancelled'], default: 'pending' },
  orderedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  orderedAt: { type: Date, default: Date.now }
}, { timestamps: true });

labOrderSchema.index({ record: 1, orderedAt: -1 });

export default mongoose.model('LabOrder', labOrderSchema);
