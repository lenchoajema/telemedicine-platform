import mongoose from 'mongoose';

const doctorSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  specialization: {
    type: String,
    required: true
  },
  licenseNumber: {
    type: String,
    required: true,
    unique: true
  },
  education: [{
    institution: String,
    degree: String,
    year: Number
  }],
  experience: [{
    hospital: String,
    position: String,
    startYear: Number,
    endYear: Number
  }],
  verificationStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  verificationDocuments: [{
    type: {
      type: String,
      enum: ['license', 'degree', 'certification', 'identity'],
      required: true
    },
    fileUrl: {
      type: String,
      required: true
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  verificationNotes: {
    type: String
  },
  verifiedAt: {
    type: Date
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  rating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  reviewCount: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

// Ensure only one doctor profile per user (runtime safeguard – index creation may fail if duplicates already exist)
// Using sparse to avoid issues if some historical docs had null user (should not happen) and to allow migration cleanup.
// This will be a no-op if already defined.
if (!doctorSchema.indexes().some(i => i[0] && Object.keys(i[0]).length === 1 && i[0].user === 1)) {
  try {
    doctorSchema.index({ user: 1 }, { unique: true, sparse: true });
  } catch (e) {
    // Index definition errors are logged but not fatal
    console.log('Doctor model: could not define unique user index:', e.message);
  }
}

const Doctor = mongoose.model('Doctor', doctorSchema);

export default Doctor;
