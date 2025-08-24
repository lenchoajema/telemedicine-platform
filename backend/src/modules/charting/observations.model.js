import mongoose from 'mongoose';

const ObservationSchema = new mongoose.Schema({
  appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment', required: true, index: true },
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  code: { type: String },
  codeSystem: { type: String },
  label: { type: String },
  value: { type: mongoose.Schema.Types.Mixed },
  unit: { type: String },
  recordedAt: { type: Date, default: Date.now },
  source: { type: String },
}, { timestamps: true });

export default mongoose.model('Observation', ObservationSchema);
