import mongoose from 'mongoose';

const AppointmentSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    validate: {
      validator: async function(doctorId) {
        const user = await mongoose.model('User').findById(doctorId);
        return user?.role === 'doctor';
      },
      message: 'The specified user is not a doctor'
    }
  },
  date: {
    type: Date,
    required: true,
    validate: {
      validator: function(date) {
        return date > new Date();
      },
      message: 'Appointment date must be in the future'
    }
  },
  duration: {  // in minutes
    type: Number,
    min: 15,
    max: 120,
    default: 30
  },
  status: {
    type: String,
    enum: ['scheduled', 'completed', 'cancelled', 'no-show'],
    default: 'scheduled'
  },
  reason: {
    type: String,
    maxlength: 500
  },
  symptoms: [{
    type: String,
    maxlength: 100
  }],
  meetingUrl: String,
  // Medical data (doctor-editable)
  diagnosis: {
    type: String,
    maxlength: 1000
  },
  prescription: [{
    medication: String,
    dosage: String,
    instructions: String
  }]
}, { 
  timestamps: true,
  toJSON: { virtuals: true } 
});

// Compound index for doctor availability
AppointmentSchema.index({ 
  doctor: 1, 
  date: 1,
  status: 1 
}, { unique: true });

// Virtual for end time
AppointmentSchema.virtual('endTime').get(function() {
  const end = new Date(this.date);
  end.setMinutes(end.getMinutes() + this.duration);
  return end;
});

// Query helper for active appointments
AppointmentSchema.query.active = function() {
  return this.where({ status: { $in: ['scheduled'] } });
};

export default mongoose.model('Appointment', AppointmentSchema);