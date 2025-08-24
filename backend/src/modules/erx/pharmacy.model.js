import mongoose from 'mongoose';

const PharmacySchema = new mongoose.Schema({
  name: { type: String, required: true },
  address: { type: String },
  city: { type: String },
  state: { type: String },
  country: { type: String, uppercase: true, trim: true }, // ISO2 preferred
  phone: { type: String },
  npi: { type: String },
  ediEndpoint: { type: String },
  // Portal owner/manager user
  ownerUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true, default: null },
  // New fields for portal verification and metadata
  verificationStatus: { type: String, enum: ['Pending', 'Verified', 'Rejected'], default: 'Pending' },
  geoJSON: { type: mongoose.Schema.Types.Mixed, default: null },
  hoursJSON: { type: mongoose.Schema.Types.Mixed, default: null },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

PharmacySchema.index({ name: 1, city: 1, state: 1 });
PharmacySchema.index({ isActive: 1, verificationStatus: 1 });
// Enable geospatial queries when coordinates provided
try { PharmacySchema.index({ geoJSON: '2dsphere' }); } catch { /* noop for non-Point data */ }

export default mongoose.model('Pharmacy', PharmacySchema);
