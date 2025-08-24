import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userRole: {
    type: String,
    enum: ['patient', 'doctor', 'admin', 'pharmacist', 'laboratory'],
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
    'user_deleted',
      'password_changed',
      'doctor_verified',
      'follow_up_scheduled',
      // Chat events
      'create_session',
      'fetch_messages',
      'post_message',
      'send_general_message',
      'mark_read',
      'support_session',
      // Settings & Family
      'update_personal_settings',
      'update_preferences',
      'update_privacy',
      'family_group_created',
      'family_member_added',
      'family_member_removed',
  'set_acting_as',
  // Billing & Pricing
  'quote_created',
  'payment_intent_created',
  'payment_webhook_received',
  'invoice_finalized',
  'subscription_created',
  'subscription_canceled',
  'subscription_usage_recorded',
  'eligibility_check_created',
  'claim_created',
  // Admin data ops
  'users_exported',
  'users_imported'
    ]
  },
  resourceType: {
    type: String,
    enum: [
      'appointment',
      'medical_record',
      'user',
      'doctor',
      'patient',
      // Chat resources
      'chat_session',
      'chat_message',
      // Settings & Family
      'user_settings',
      'family_group',
  'family_member',
  // Insurance & Billing
  'insurance',
  'payment_method',
  'quote',
  'payment_intent',
  'payment',
  'invoice',
  'plan',
  'subscription',
  'subscription_usage',
  'eligibility_check',
  'claim'
    ],
    required: true
  },
  resourceId: { type: mongoose.Schema.Types.ObjectId },
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
