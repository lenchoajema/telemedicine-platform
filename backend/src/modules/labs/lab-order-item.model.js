import mongoose from 'mongoose';

const LabOrderItemSchema = new mongoose.Schema({
  labExamId: { type: mongoose.Schema.Types.ObjectId, ref: 'LabExamination', required: true },
  labTestId: { type: mongoose.Schema.Types.ObjectId, ref: 'LabTestCatalog', required: true },
  status: { type: String, enum: ['Ordered', 'InProgress', 'Completed', 'Rejected'], default: 'Ordered' },
  resultValuesJSON: { type: mongoose.Schema.Types.Mixed, default: null },
  resultFileURL: { type: String },
  completedAt: { type: Date },
}, { timestamps: true });

LabOrderItemSchema.index({ labExamId: 1, status: 1 });

export default mongoose.model('LabOrderItem', LabOrderItemSchema);
