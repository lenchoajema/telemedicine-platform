import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema({
  platform: {
    siteName: { type: String, default: 'TeleMed Platform' },
    siteDescription: { type: String, default: 'Modern telemedicine platform for healthcare providers' },
    allowRegistration: { type: Boolean, default: true },
    requireEmailVerification: { type: Boolean, default: true },
    enableVideoCalls: { type: Boolean, default: true },
    maintenanceMode: { type: Boolean, default: false },
    maxAppointmentsPerDay: { type: Number, default: 50 },
    appointmentDuration: { type: Number, default: 30 },
    timeZone: { type: String, default: 'America/New_York' }
  },
  users: {
    autoApprovePatients: { type: Boolean, default: true },
    requireDoctorVerification: { type: Boolean, default: true },
    sessionTimeout: { type: Number, default: 60 },
    passwordComplexity: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    maxLoginAttempts: { type: Number, default: 5 },
    lockoutDuration: { type: Number, default: 30 }
  },
  notifications: {
    emailEnabled: { type: Boolean, default: true },
    smsEnabled: { type: Boolean, default: false },
    pushEnabled: { type: Boolean, default: true },
    adminNotifications: { type: Boolean, default: true },
    systemAlerts: { type: Boolean, default: true },
    appointmentReminders: { type: Boolean, default: true },
    marketingEmails: { type: Boolean, default: false }
  },
  payments: {
    acceptPayments: { type: Boolean, default: true },
    paymentProvider: { type: String, enum: ['stripe', 'paypal', 'square'], default: 'stripe' },
    currency: { type: String, enum: ['USD', 'EUR', 'GBP', 'CAD'], default: 'USD' },
    consultationFee: { type: Number, default: 75 },
    platformFee: { type: Number, default: 10 },
    refundPolicy: { type: String, default: 'Within 24 hours' },
    autoRefunds: { type: Boolean, default: false }
  },
  security: {
    enableTwoFactor: { type: Boolean, default: false },
    requireHttps: { type: Boolean, default: true },
    enableAuditLogs: { type: Boolean, default: true },
    dataRetentionDays: { type: Number, default: 365 },
    enableBackups: { type: Boolean, default: true },
    backupFrequency: { type: String, enum: ['hourly', 'daily', 'weekly'], default: 'daily' },
    encryptSensitiveData: { type: Boolean, default: true }
  }
}, {
  timestamps: true
});

// Ensure only one settings document exists
settingsSchema.statics.getSingleton = async function() {
  let settings = await this.findOne();
  if (!settings) {
    settings = new this();
    await settings.save();
  }
  return settings;
};

const Settings = mongoose.model('Settings', settingsSchema);
export default Settings;