import mongoose from 'mongoose';

const timeSlotSchema = new mongoose.Schema({
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true,
    index: true
  },
  date: {
    type: Date,
    required: true,
    index: true
  },
  startTime: {
    type: String, // Format: "HH:MM" (e.g., "09:00")
    required: true
  },
  endTime: {
    type: String, // Format: "HH:MM" (e.g., "09:30")
    required: true
  },
  isAvailable: {
    type: Boolean,
    default: true,
    index: true
  },
  appointmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment',
    default: null
  },
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  reservedAt: {
    type: Date,
    default: null
  },
  reservationExpires: {
    type: Date,
    default: null
  },
  // Track slot history
  history: [{
    action: {
      type: String,
      enum: ['created', 'reserved', 'booked', 'cancelled', 'released'],
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment'
    },
    reason: String
  }]
}, {
  timestamps: true
});

// Compound indexes for efficient queries
timeSlotSchema.index({ doctorId: 1, date: 1, startTime: 1 }, { unique: true });
timeSlotSchema.index({ doctorId: 1, date: 1, isAvailable: 1 });
timeSlotSchema.index({ reservationExpires: 1 }, { sparse: true });

// Add methods to the schema
timeSlotSchema.methods.reserve = function(patientId, durationMinutes = 15) {
  this.isAvailable = false;
  this.patientId = patientId;
  this.reservedAt = new Date();
  this.reservationExpires = new Date(Date.now() + durationMinutes * 60000);
  
  this.history.push({
    action: 'reserved',
    patientId: patientId,
    reason: `Temporary reservation for ${durationMinutes} minutes`
  });
  
  return this.save();
};

timeSlotSchema.methods.book = function(appointmentId, patientId) {
  this.isAvailable = false;
  this.appointmentId = appointmentId;
  this.patientId = patientId;
  this.reservedAt = new Date();
  this.reservationExpires = null;
  
  this.history.push({
    action: 'booked',
    patientId: patientId,
    appointmentId: appointmentId,
    reason: 'Appointment confirmed'
  });
  
  return this.save();
};

timeSlotSchema.methods.release = function(reason = 'Manual release') {
  const previousPatientId = this.patientId;
  const previousAppointmentId = this.appointmentId;
  
  this.isAvailable = true;
  this.appointmentId = null;
  this.patientId = null;
  this.reservedAt = null;
  this.reservationExpires = null;
  
  this.history.push({
    action: 'released',
    patientId: previousPatientId,
    appointmentId: previousAppointmentId,
    reason: reason
  });
  
  return this.save();
};

// Static method to clean expired reservations
timeSlotSchema.statics.cleanExpiredReservations = async function() {
  const now = new Date();
  const expiredSlots = await this.find({
    reservationExpires: { $lte: now },
    isAvailable: false,
    appointmentId: null
  });
  
  for (const slot of expiredSlots) {
    await slot.release('Reservation expired');
  }
  
  return expiredSlots.length;
};

// Static method to generate time slots for a doctor
timeSlotSchema.statics.generateSlotsForDoctor = async function(doctorId, date, workingHours = { start: '09:00', end: '17:00' }, slotDuration = 30) {
  const slots = [];
  const startTime = workingHours.start.split(':');
  const endTime = workingHours.end.split(':');
  
  const startMinutes = parseInt(startTime[0]) * 60 + parseInt(startTime[1]);
  const endMinutes = parseInt(endTime[0]) * 60 + parseInt(endTime[1]);
  
  for (let minutes = startMinutes; minutes < endMinutes; minutes += slotDuration) {
    const startHour = Math.floor(minutes / 60);
    const startMin = minutes % 60;
    const endHour = Math.floor((minutes + slotDuration) / 60);
    const endMin = (minutes + slotDuration) % 60;
    
    const startTimeStr = `${startHour.toString().padStart(2, '0')}:${startMin.toString().padStart(2, '0')}`;
    const endTimeStr = `${endHour.toString().padStart(2, '0')}:${endMin.toString().padStart(2, '0')}`;
    
    // Check if slot already exists
    const existingSlot = await this.findOne({
      doctorId,
      date: new Date(date),
      startTime: startTimeStr
    });
    
    if (!existingSlot) {
      const slot = new this({
        doctorId,
        date: new Date(date),
        startTime: startTimeStr,
        endTime: endTimeStr,
        history: [{
          action: 'created',
          reason: 'Auto-generated slot'
        }]
      });
      
      slots.push(slot);
    }
  }
  
  if (slots.length > 0) {
    await this.insertMany(slots);
  }
  
  return slots;
};

const TimeSlot = mongoose.model('TimeSlot', timeSlotSchema);

export default TimeSlot;
