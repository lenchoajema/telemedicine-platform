import mongoose from 'mongoose';

const ConsultationNoteSchema = new mongoose.Schema({
  appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment', required: true, index: true },
  lifecycleId: { type: String, index: true },
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  templateId: { type: mongoose.Schema.Types.ObjectId, ref: 'NoteTemplate' },
  noteStatus: { type: String, enum: ['Draft','Signed','Amended'], default: 'Draft' },
  version: { type: Number, default: 1 },
  sectionsJSON: { type: mongoose.Schema.Types.Mixed, default: { subjective: '', objective: '', assessment: '', plan: '' } },
  signedById: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  signedAt: { type: Date },
  scribeAttribution: { type: String },
}, { timestamps: true });

ConsultationNoteSchema.index({ appointmentId: 1, version: -1 });

export default mongoose.model('ConsultationNote', ConsultationNoteSchema);
