import mongoose from 'mongoose';

const ImagingReportSchema = new mongoose.Schema({
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  modality: { type: String, required: true }, // e.g., 'X-Ray', 'MRI', 'CT'
  bodyPart: { type: String },
  orderedAt: { type: Date, default: Date.now },
  performedAt: { type: Date },
  reportedAt: { type: Date },
  status: { type: String, enum: ['scheduled','in-progress','completed','cancelled'], default: 'scheduled' },
  findings: { type: String },
  impression: { type: String },
  orderingPhysician: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  radiologist: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  facilityName: { type: String },
  attachments: [{
    fileName: String,
    originalName: String,
    mimeType: String,
    size: Number,
    uploadedAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

export default mongoose.model('ImagingReport', ImagingReportSchema);
