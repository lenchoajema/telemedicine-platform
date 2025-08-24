import mongoose from 'mongoose';

const PHRExportJobSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  format: { type: String, enum: ['pdf','json_fhir'], required: true },
  status: { type: String, enum: ['Pending','Processing','Completed','Failed'], default: 'Pending' },
  artifactUrl: { type: String },
  progress: { type: Number, default: 0 },
  totalItems: { type: Number },
  modelVersion: { type: String },
  createdAt: { type: Date, default: Date.now },
  completedAt: { type: Date },
  error: { type: String }
});

PHRExportJobSchema.index({ patientId: 1, createdAt: -1 });

export default mongoose.models.PHRExportJob || mongoose.model('PHRExportJob', PHRExportJobSchema);
