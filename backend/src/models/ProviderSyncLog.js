import mongoose from 'mongoose';

const providerSyncLogSchema = new mongoose.Schema(
  {
    provider: { type: String, required: true },
    countryIso2: { type: String },
    startedAt: { type: Date, default: Date.now },
    finishedAt: { type: Date },
    added: { type: Number, default: 0 },
    updated: { type: Number, default: 0 },
    disabled: { type: Number, default: 0 },
    errorsJSON: { type: Object, default: {} },
  },
  { timestamps: true }
);

providerSyncLogSchema.index({ provider: 1, countryIso2: 1, createdAt: -1 });

const ProviderSyncLog = mongoose.model('ProviderSyncLog', providerSyncLogSchema);
export default ProviderSyncLog;
