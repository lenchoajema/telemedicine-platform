import mongoose from 'mongoose';

const notificationChannelsSchema = new mongoose.Schema({
  email: { type: Boolean, default: true },
  sms: { type: Boolean, default: false },
  push: { type: Boolean, default: false },
}, { _id: false });

const privacySchema = new mongoose.Schema({
  shareDataWithDoctors: { type: Boolean, default: true },
  allowDataAnalytics: { type: Boolean, default: false },
  shareWithInsurance: { type: Boolean, default: false },
  publicProfile: { type: Boolean, default: false },
}, { _id: false });

const preferencesSchema = new mongoose.Schema({
  appointmentReminders: { type: Boolean, default: true },
  medicationReminders: { type: Boolean, default: true },
  healthTips: { type: Boolean, default: true },
  marketingEmails: { type: Boolean, default: false },
  channels: { type: notificationChannelsSchema, default: () => ({}) },
  timeZone: { type: String, default: 'UTC' },
  language: { type: String, default: 'en' },
}, { _id: false });

const userSettingsSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  preferences: { type: preferencesSchema, default: () => ({}) },
  privacy: { type: privacySchema, default: () => ({}) },
  allowFamilyProxies: { type: Boolean, default: false },
  actingAsUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
}, { timestamps: true });

userSettingsSchema.index({ userId: 1 }, { unique: true });

const UserSettings = mongoose.model('UserSettings', userSettingsSchema);

export default UserSettings;
