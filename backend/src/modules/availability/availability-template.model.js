import mongoose from 'mongoose';

const availabilityTemplateSchema = new mongoose.Schema({
  doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true, index: true },
  version: { type: Number, required: true, default: 0 },
  rulesJSON: { type: Object, required: true },
  timeZone: { type: String, required: true, default: 'UTC' },
  isActive: { type: Boolean, default: true },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

availabilityTemplateSchema.index({ doctor: 1, isActive: 1 });

export default mongoose.model('AvailabilityTemplate', availabilityTemplateSchema);
