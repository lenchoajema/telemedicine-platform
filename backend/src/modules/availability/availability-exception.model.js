import mongoose from 'mongoose';

const availabilityExceptionSchema = new mongoose.Schema({
  doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true, index: true },
  date: { type: Date, required: true, index: true },
  type: { type: String, enum: ['Blackout','AddSlot','Modify'], required: true },
  payloadJSON: { type: Object, required: true },
  createdAt: { type: Date, default: Date.now }
});

availabilityExceptionSchema.index({ doctor: 1, date: 1 });

export default mongoose.model('AvailabilityException', availabilityExceptionSchema);
