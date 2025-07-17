import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userRole: {
    type: String,
    enum: ['patient', 'doctor', 'admin'],
    required: true
  },
  action: {
    type: String,
    required: true,
    enum: [
      'appointment_created',
      'appointment_updated', 
      'appointment_cancelled',
      'appointment_completed',
      'medical_record_created',
      'medical_record_updated',
      'medical_record_viewed',
      'user_login',
      'user_logout',
      'user_created',
      'user_updated',
      'password_changed',
      'doctor_verified',
      'follow_up_scheduled'
    ]
  },
  resourceType: {
    type: String,
    enum: ['appointment', 'medical_record', 'user', 'doctor', 'patient'],
    required: true
  },
  resourceId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  changes: {
    before: mongoose.Schema.Types.Mixed,
    after: mongoose.Schema.Types.Mixed
  },
  ipAddress: {
    type: String
  },
  userAgent: {
    type: String
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for efficient queries
auditLogSchema.index({ userId: 1, timestamp: -1 });
auditLogSchema.index({ resourceType: 1, resourceId: 1 });
auditLogSchema.index({ action: 1, timestamp: -1 });

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

export default AuditLog;
