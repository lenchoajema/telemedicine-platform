import mongoose from 'mongoose';

const appointmentSlotSchema = new mongoose.Schema(
  {
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor',
      required: true,
      index: true,
    },
    date: {
      type: Date,
      required: true,
      index: true,
    },
    startTime: {
      type: String,
      required: true,
    },
    endTime: {
      type: String,
      required: true,
    },
    isAvailable: {
      type: Boolean,
      default: true,
      index: true,
    },
    // Availability Authoring Additions (all optional, safe for existing code)
    sourceTemplateVersion: { type: Number, default: null },
    slotType: { type: String, enum: ['Consult','FollowUp','Group'], default: 'Consult' },
    holdExpiresAt: { type: Date, default: null },
    slotHash: { type: String, default: null }, // Integrity HMAC
    // Lightweight optimistic version for future updates (not yet used broadly)
    version: { type: Number, default: 0 },
  },
  { timestamps: true }
);

appointmentSlotSchema.index({ doctor: 1, date: 1, startTime: 1 }, { unique: false });

const AppointmentSlot = mongoose.model(
  'AppointmentSlot',
  appointmentSlotSchema
);

export default AppointmentSlot;
