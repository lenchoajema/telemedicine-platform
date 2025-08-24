import mongoose from 'mongoose';

const prescriptionSchema = new mongoose.Schema({
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' },
  // Legacy free-text prescription field (kept for compatibility)
  prescription: { type: String },
  // Extended structured fields
  drugId: { type: mongoose.Schema.Types.ObjectId, ref: 'FormularyDrug' },
  route: { type: String },
  frequency: { type: String },
  quantity: { type: String },
  daysSupply: { type: Number },
  refills: { type: Number, default: 0 },
  startDate: { type: Date },
  endDate: { type: Date },
  substitutionAllowed: { type: Boolean, default: true },
  pharmacyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Pharmacy' },
  transmissionStatus: { type: String, enum: ['Draft','Queued','Sent','Failed','Cancelled'], default: 'Draft' },
  externalMessageId: { type: String },
  cancelReason: { type: String },
  lifecycleId: { type: String },
  date: { type: Date, default: Date.now }
}, { timestamps: true });

prescriptionSchema.index({ patient: 1, date: -1 });

export default mongoose.model('Prescription', prescriptionSchema);
