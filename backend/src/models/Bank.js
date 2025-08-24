import mongoose from 'mongoose';

const bankSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    countryIso2: { type: String, required: true },
    isInternational: { type: Boolean, default: false },
    swiftBIC: { type: String },
    centralBankCode: { type: String },
    shortCode: { type: String },
    website: { type: String },
    supportedChannels: { type: [String], default: [] },
    providerCodes: { type: Object, default: {} }, // { Paystack: '...', Flutterwave: '...' }
    status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
    lastVerifiedAt: { type: Date },
  },
  { timestamps: true }
);

bankSchema.index({ name: 1, countryIso2: 1 }, { unique: true });

const Bank = mongoose.model('Bank', bankSchema);
export default Bank;
