import mongoose from 'mongoose';

const userProfileSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', unique: true, required: true, index: true },
  firstName: { type: String, trim: true },
  lastName: { type: String, trim: true },
  phone: { type: String, trim: true },
  dateOfBirth: { type: Date },
  gender: { type: String, enum: ['Male','Female','Other','PreferNot'], default: 'PreferNot' },
  addressLine1: { type: String, trim: true },
  addressLine2: { type: String, trim: true },
  city: { type: String, trim: true },
  state: { type: String, trim: true },
  postalCode: { type: String, trim: true },
  country: { type: String, trim: true },
  region: { type: String, trim: true }, // For countries where 'state' is not applicable (e.g., many African nations)
  emergencyContactName: { type: String, trim: true },
  emergencyContactPhone: { type: String, trim: true },
  primaryDoctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  weightKg: { type: Number, min: 0, max: 500 },
  heightCm: { type: Number, min: 0, max: 300 },
  bloodType: { type: String, trim: true },
  version: { type: Number, default: 0 },
}, { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } });

const UserProfile = mongoose.model('UserProfile', userProfileSchema);
export default UserProfile;
