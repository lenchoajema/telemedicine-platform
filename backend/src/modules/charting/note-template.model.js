import mongoose from 'mongoose';

const NoteTemplateSchema = new mongoose.Schema({
  name: { type: String, required: true },
  specialty: { type: String },
  sectionsJSON: { type: mongoose.Schema.Types.Mixed, default: {} },
  isActive: { type: Boolean, default: true },
  createdById: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
}, { timestamps: true });

NoteTemplateSchema.index({ name: 1, specialty: 1 }, { unique: true });

export default mongoose.model('NoteTemplate', NoteTemplateSchema);
