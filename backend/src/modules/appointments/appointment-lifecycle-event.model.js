import mongoose from 'mongoose';

const AppointmentLifecycleEventSchema = new mongoose.Schema({
  lifecycleId: {
    type: String,
    required: true,
    index: true
  },
  eventType: {
    type: String,
    required: true
  },
  actorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  payload: {
    type: mongoose.Schema.Types.Mixed
  }
});

export default mongoose.model('AppointmentLifecycleEvent', AppointmentLifecycleEventSchema);
