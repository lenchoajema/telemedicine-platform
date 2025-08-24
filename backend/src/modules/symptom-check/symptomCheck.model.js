import mongoose from 'mongoose';

const SymptomCheckSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
  triageLevel: { type: String, enum: ['pending','self-care','telemedicine','emergency'], required: true },
  recommendation: { type: String },
  confidenceScore: { type: Number },
  modelVersion: { type: String }
});

export default mongoose.models.SymptomCheck || mongoose.model('SymptomCheck', SymptomCheckSchema);
