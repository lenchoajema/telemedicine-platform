import mongoose from 'mongoose';

const appointmentSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    required: true,
    index: true
  },
  time: {
    type: String, // Format: "HH:MM" (e.g., "09:00")
    required: true
  },
  duration: {
    type: Number,
    default: 30, // Default 30 minutes
    required: true
  },
  timeSlot: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TimeSlot',
    default: null // Optional - for appointments created with time slot system
  },
  status: {
    type: String,
    enum: ['scheduled', 'completed', 'cancelled', 'no-show'],
    default: 'scheduled',
    index: true
  },
  reason: {
    type: String
  },
  symptoms: [{
    type: String
  }],
  notes: {
    type: String
  },
  meetingUrl: {
    type: String
  },
  followUpRequired: {
    type: Boolean,
    default: false
  },
  followUpDate: {
    type: Date
  },
  followUpNotes: {
    type: String
  },
  medicalRecord: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MedicalRecord'
  },
  completionNotes: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound indexes for efficient queries
appointmentSchema.index({ patient: 1, date: 1 }); // Patient's appointments by date
appointmentSchema.index({ doctor: 1, date: 1 }); // Doctor's appointments by date
appointmentSchema.index({ doctor: 1, status: 1 }); // Doctor's appointments by status
appointmentSchema.index({ timeSlot: 1 }, { sparse: true }); // TimeSlot reference (sparse for optional)
appointmentSchema.index({ status: 1, date: 1 }); // Status and date for dashboard queries

// Ensure doctor isn't double-booked (removed unique constraint to allow flexibility)
appointmentSchema.index({ doctor: 1, date: 1, time: 1 });

// Virtual to get appointment datetime
appointmentSchema.virtual('datetime').get(function() {
  if (!this.date || !this.time) return null;
  
  const [hours, minutes] = this.time.split(':').map(Number);
  const datetime = new Date(this.date);
  datetime.setHours(hours, minutes, 0, 0);
  return datetime;
});

// Virtual to get end time
appointmentSchema.virtual('endTime').get(function() {
  if (!this.datetime) return null;
  
  const endTime = new Date(this.datetime);
  endTime.setMinutes(endTime.getMinutes() + this.duration);
  return endTime;
});

// Pre-save middleware to validate appointment time
appointmentSchema.pre('save', async function(next) {
  // Validate time format
  if (this.time && !/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(this.time)) {
    const error = new Error('Invalid time format. Use HH:MM format.');
    return next(error);
  }
  
  // Update the updatedAt field
  this.updatedAt = new Date();
  
  next();
});

// Static method to find conflicting appointments
appointmentSchema.statics.findConflictingAppointments = function(doctorId, date, time, duration, excludeId = null) {
  const query = {
    doctor: doctorId,
    date: {
      $gte: new Date(date.getFullYear(), date.getMonth(), date.getDate()),
      $lt: new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1)
    },
    status: { $ne: 'cancelled' }
  };
  
  if (excludeId) {
    query._id = { $ne: excludeId };
  }
  
  return this.find(query);
};

const Appointment = mongoose.model('Appointment', appointmentSchema);

export default Appointment;
