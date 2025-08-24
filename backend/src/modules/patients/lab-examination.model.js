import mongoose from 'mongoose';

const LabExaminationSchema = new mongoose.Schema({
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  testType: { type: String, required: true }, // e.g., 'CBC', 'Lipid Panel'
  orderedAt: { type: Date, default: Date.now },
  collectedAt: { type: Date },
  resultedAt: { type: Date },
  status: { type: String, enum: ['ordered','in-progress','completed','cancelled'], default: 'ordered' },
  labId: { type: mongoose.Schema.Types.ObjectId, ref: 'Laboratory', default: null },
  priceQuoted: { type: Number },
  panelJSON: { type: mongoose.Schema.Types.Mixed, default: null },
  results: [{
    name: String,
    value: String,
    unit: String,
    referenceRange: String,
    flag: { type: String, enum: ['low','high','normal','abnormal',''], default: '' }
  }],
  notes: { type: String },
  orderingPhysician: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  laboratoryName: { type: String },
  attachments: [{
    fileName: String,
    originalName: String,
    mimeType: String,
    size: Number,
    uploadedAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

export default mongoose.model('LabExamination', LabExaminationSchema);
