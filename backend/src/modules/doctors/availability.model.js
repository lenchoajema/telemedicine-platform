import mongoose from 'mongoose';

const DoctorAvailabilitySchema = new mongoose.Schema({
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  day: {
    type: String,
    required: true,
    enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
    lowercase: true
  },
  startTime: {
    type: String,
    required: true,
    match: /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/
  },
  endTime: {
    type: String,
    required: true,
    match: /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/
  },
  slotDuration: {
    type: Number,
    required: true,
    min: 15,
    max: 480, // Max 8 hours
    default: 30
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound index to ensure unique availability per doctor per day
DoctorAvailabilitySchema.index({ doctor: 1, day: 1 }, { unique: true });

// Virtual for generating time slots
DoctorAvailabilitySchema.virtual('timeSlots').get(function() {
  const slots = [];
  const start = parseTime(this.startTime);
  const end = parseTime(this.endTime);
  
  let currentTime = start;
  while (currentTime < end) {
    const timeString = formatTime(currentTime);
    slots.push(timeString);
    currentTime += this.slotDuration;
  }
  
  return slots;
});

// Helper function to parse time string to minutes
function parseTime(timeString) {
  const [hours, minutes] = timeString.split(':').map(Number);
  return hours * 60 + minutes;
}

// Helper function to format minutes to time string
function formatTime(minutes) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

// Static method to get availability for a specific doctor and day
DoctorAvailabilitySchema.statics.findByDoctorAndDay = function(doctorId, day) {
  return this.findOne({ 
    doctor: doctorId, 
    day: day.toLowerCase(),
    isActive: true 
  });
};

// Static method to get all availability for a doctor
DoctorAvailabilitySchema.statics.findByDoctor = function(doctorId) {
  return this.find({ 
    doctor: doctorId,
    isActive: true 
  }).sort({ day: 1 });
};

export default mongoose.model('DoctorAvailability', DoctorAvailabilitySchema);
