import mongoose from 'mongoose';

const consultationNotesSchema = new mongoose.Schema({
  doctorNotes: { type: String },
  diagnosis: { type: String }
}, { _id: false });

const appointmentSchema = new mongoose.Schema({
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  timeSlot: { type: mongoose.Schema.Types.ObjectId, ref: 'TimeSlot', index: true },
  startAt: { type: Date, required: true },
  endAt: { type: Date, required: true },
  consultationType: { type: String, enum: ['Video', 'Audio', 'Chat'], default: 'Video' },
  status: { type: String, enum: ['Scheduled', 'Completed', 'Cancelled', 'InProgress'], default: 'Scheduled', index: true },
  reason: { type: String, trim: true },
  cancelReason: { type: String, trim: true },
  notes: consultationNotesSchema,
}, { timestamps: true });

appointmentSchema.index({ doctor: 1, startAt: 1 });
approximateDurationVirtualIndex();

function approximateDurationVirtualIndex(){
  // placeholder for potential future computed indexing
}

const Appointment = mongoose.model('Appointment', appointmentSchema);
export default Appointment;
