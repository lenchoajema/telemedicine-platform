import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['patient', 'doctor', 'admin', 'pharmacist', 'laboratory'],
    default: 'patient',
  },
  profile: {
  firstName: String,
  lastName: String,
  dateOfBirth: Date,
  title: String, // For doctors, e.g., 'Dr.'
  phone: String,
  photo: String,
  gender: String,
  address: String,
  city: String,
  state: String,
  zipCode: String,
  emergencyContact: String,
  emergencyPhone: String,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  verificationDetails: {
  licenseNumber: String,
  specialty: { type: mongoose.Schema.Types.ObjectId, ref: 'Specialty' },
  yearsOfExperience: Number,
  consultationFee: Number,
  biography: String,
  },
  // Chat consent flag to enforce user consent for chat feature
  hasConsentedToChat: {
    type: Boolean,
    default: false
  },
  // Fields from Phase 1 of implementation plan
  timeZone: {
    type: String,
    default: 'UTC',
  },
  status: {
    type: String,
    enum: ['Active', 'Suspended', 'Deactivated'],
    default: 'Active',
  },
  lastLoginAt: {
    type: Date,
  },
}, { timestamps: true });

// Middleware to hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Method to compare entered password with hashed password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Alias comparePassword for backward compatibility
userSchema.methods.comparePassword = userSchema.methods.matchPassword;

const User = mongoose.model('User', userSchema);

export default User;
