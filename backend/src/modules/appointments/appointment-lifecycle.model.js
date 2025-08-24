import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const AppointmentLifecycleSchema = new mongoose.Schema({
  lifecycleId: {
    type: String,
    default: uuidv4,
    unique: true
  },
  appointmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment',
    required: true
  },
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  startAt: {
    type: Date,
    default: Date.now
  },
  endAt: Date,
  currentStatus: {
    type: String,
    enum: [
      'Booked',
  'UnderReview',
      'LabOrdered',
      'ImagingOrdered',
  'ResultsPosted',
      'ConsultationCompleted',
      'MedicationPrescribed',
  'RxRouted',
  'RxDispensed',
      'FollowUpScheduled',
      'Closed'
    ],
    default: 'Booked'
  },
  lastUpdatedAt: {
    type: Date,
    default: Date.now
  },
  lastUpdatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  closureNotes: String
});

export default mongoose.model('AppointmentLifecycle', AppointmentLifecycleSchema);
