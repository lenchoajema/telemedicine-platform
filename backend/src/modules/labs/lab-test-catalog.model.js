import mongoose from 'mongoose';

const LabTestCatalogSchema = new mongoose.Schema({
  labId: { type: mongoose.Schema.Types.ObjectId, ref: 'Laboratory', required: true },
  testCode: { type: String, required: true },
  testName: { type: String, required: true },
  technology: { type: String, required: true },
  turnaroundTime: { type: String },
  price: { type: Number, required: true },
  sampleReqJSON: { type: mongoose.Schema.Types.Mixed, default: null },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

LabTestCatalogSchema.index({ labId: 1, isActive: 1 });
LabTestCatalogSchema.index({ labId: 1, testCode: 1 }, { unique: true });

export default mongoose.model('LabTestCatalog', LabTestCatalogSchema);
