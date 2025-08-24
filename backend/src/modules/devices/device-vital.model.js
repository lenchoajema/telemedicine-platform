import mongoose from 'mongoose';

const DeviceVitalSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  source: { type: String, enum: ['AppleHealth', 'GoogleFit', 'Fitbit'], required: true },
  vitalType: { type: String, enum: ['HeartRate', 'Steps', 'Sleep', 'BloodPressure'], required: true },
  value: { type: mongoose.Schema.Types.Mixed, required: true }, // Can be a number or a JSON object for complex data like sleep stages
  unit: { type: String },
  recordedAt: { type: Date, required: true },
  syncedAt: { type: Date, default: Date.now },
}, { timestamps: true });

// Index for efficient querying and deduplication
DeviceVitalSchema.index({ user: 1, vitalType: 1, recordedAt: 1 }, { unique: true });

export default mongoose.model('DeviceVital', DeviceVitalSchema);
