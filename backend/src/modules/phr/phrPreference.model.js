import mongoose from 'mongoose';

const PHRPreferenceSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', unique:true, required: true },
  share_phr_by_default: { type: Boolean, default: false },
  allow_ephemeral_links: { type: Boolean, default: true },
  allow_export_pdf: { type: Boolean, default: true },
  allow_export_fhir: { type: Boolean, default: false }
});

export default mongoose.models.PHRPreference || mongoose.model('PHRPreference', PHRPreferenceSchema);
