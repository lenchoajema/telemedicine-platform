import mongoose from 'mongoose';

const medicationSchema = new mongoose.Schema({
  name: { type: String, trim: true },
  dose: { type: String, trim: true },
  schedule: { type: String, trim: true },
}, { _id: false });

const medicalProfileSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', unique: true, required: true, index: true },
  bloodType: { type: String, trim: true },
  allergies: { type: [String], default: [] },
  currentMedications: { type: [medicationSchema], default: [] },
  medicalConditions: { type: [String], default: [] },
  version: { type: Number, default: 0 },
}, { timestamps: true });

const MedicalProfile = mongoose.model('MedicalProfile', medicalProfileSchema);
export default MedicalProfile;
