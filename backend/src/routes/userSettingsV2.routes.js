import express from 'express';
import crypto from 'crypto';
import { authenticate } from '../middleware/auth.middleware.js';
import User from '../models/User.js';
import UserProfile from '../models/UserProfile.js';
import MedicalProfile from '../models/MedicalProfile.js';
import NotificationPreferences from '../models/NotificationPreferences.js';
import PrivacySettings from '../models/PrivacySettings.js';
import SecuritySettings from '../models/SecuritySettings.js';
import Insurance from '../models/Insurance.js';
import PaymentMethod from '../models/PaymentMethod.js';
import Invoice from '../models/Invoice.js';
import Payment from '../models/Payment.js';
import Quote from '../models/Quote.js';
import FamilyGroup from '../models/FamilyGroup.js';
import UserSettings from '../models/UserSettings.js';
import AuditService from '../services/AuditService.js';

const router = express.Router();
router.use(authenticate);

async function ensure(model, userId, defaults = {}) {
  let doc = await model.findOne({ userId });
  if (!doc) doc = await model.create({ userId, ...defaults });
  return doc;
}

function computeCompositeVersion(parts) {
  const concat = parts.map(p => `${p.model}:${p.version}`).join('|');
  return crypto.createHash('sha256').update(concat).digest('hex');
}

function assertSelf(req, res, next) {
  // Support the convenience alias 'self'
  if (req.params.userId === 'self') {
    req.params.userId = String(req.user._id);
  }
  if (String(req.user._id) !== String(req.params.userId)) {
    return res.status(403).json({ error: 'Forbidden: only own settings allowed' });
  }
  next();
}

router.get('/:userId/settings', assertSelf, async (req, res) => {
  try {
    const userId = req.params.userId;
    const [profile, medical, notifications, privacy, security] = await Promise.all([
      ensure(UserProfile, userId),
      ensure(MedicalProfile, userId),
      ensure(NotificationPreferences, userId),
      ensure(PrivacySettings, userId),
      ensure(SecuritySettings, userId),
    ]);
    const [insurance, paymentMethods, quotes, invoices, payments, familyGroup, userSettings] = await Promise.all([
      Insurance.find({ userId }).lean(),
      PaymentMethod.find({ userId }).lean(),
      Quote.find({ patientId: userId }).lean(),
      Invoice.find({ userId }).sort({ createdAt: -1 }).limit(50).lean(),
      Payment.find({ userId }).sort({ createdAt: -1 }).limit(50).lean(),
      FamilyGroup.findOne({ ownerId: userId }).populate('members.userId', 'username email profile role'),
      UserSettings.findOne({ userId }).lean(),
    ]);
    const compositeVersion = computeCompositeVersion([
      { model: 'profile', version: profile.version },
      { model: 'medical', version: medical.version },
      { model: 'notifications', version: notifications.version },
      { model: 'privacy', version: privacy.version },
      { model: 'security', version: security.version },
    ]);
    const family = familyGroup ? {
      group: familyGroup,
      members: familyGroup.members,
      actingAsUserId: userSettings?.actingAsUserId || null,
    } : { group: null, members: [], actingAsUserId: userSettings?.actingAsUserId || null };
    return res.json({
      profile: profile.toObject(),
      medical: medical.toObject(),
      insurance,
      notifications: notifications.toObject(),
      privacy: privacy.toObject(),
      securityMeta: { twoFactorEnabled: security.twoFactorEnabled, lastPasswordChangeAt: security.lastPasswordChangeAt, version: security.version },
      paymentMethods,
      quotes,
      invoices,
      payments,
      family,
      compositeVersion,
    });
  } catch (e) {
    console.log('GET aggregated settings error', e);
    return res.status(500).json({ error: 'Failed to load settings' });
  }
});

function buildPut(path, model, allowedFields, action, resourceType) {
  router.put(`/:userId/${path}`, assertSelf, async (req, res) => {
    try {
      const userId = req.params.userId;
      const { version, ...payload } = req.body || {};
      const doc = await ensure(model, userId);
      if (typeof version !== 'number' || version !== doc.version) {
        return res.status(409).json({ error: 'Version conflict', latest: doc });
      }
      let changed = {}; let changedCount = 0;
      for (const f of allowedFields) {
        if (Object.prototype.hasOwnProperty.call(payload, f) && doc[f] !== payload[f]) {
          doc[f] = payload[f];
          changed[f] = payload[f];
          changedCount++;
        }
      }
      if (changedCount === 0) return res.json({ success: true, [path]: doc, unchanged: true });
      doc.version += 1;
      await doc.save();
      await AuditService.log(req.user._id, req.user.role, action, resourceType, doc._id, { fields: Object.keys(changed) }, { beforeVersion: version, afterVersion: doc.version }, req);
      return res.json({ success: true, [path]: doc });
    } catch (e) {
  console.log(`PUT ${path} error`, e);
      return res.status(500).json({ error: 'Failed to update section' });
    }
  });
}

buildPut('profile', UserProfile, [ 'firstName','lastName','phone','dateOfBirth','gender','addressLine1','addressLine2','city','state','postalCode','country','region','emergencyContactName','emergencyContactPhone','primaryDoctorId','weightKg','heightCm','bloodType' ], 'ProfileUpdate', 'user_profile');
buildPut('medical', MedicalProfile, [ 'bloodType','allergies','currentMedications','medicalConditions' ], 'MedicalUpdate', 'medical_profile');
buildPut('notifications', NotificationPreferences, [ 'appointmentReminders','emailGeneral','smsGeneral','medicationReminders','healthContent','marketing' ], 'NotificationPreferencesUpdate', 'notification_preferences');
buildPut('privacy', PrivacySettings, [ 'shareWithProviders','shareAnonymizedResearch','shareWithInsurance','publicProfileVisible' ], 'PrivacySettingsUpdate', 'privacy_settings');

router.put('/:userId/security/password', assertSelf, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body || {};
    if (!currentPassword || !newPassword) return res.status(400).json({ error: 'Missing currentPassword or newPassword' });
    const user = await User.findById(req.user._id);
    if (!await user.matchPassword(currentPassword)) return res.status(400).json({ error: 'Current password invalid' });
    user.password = newPassword;
    await user.save();
    const sec = await ensure(SecuritySettings, req.user._id);
    sec.lastPasswordChangeAt = new Date();
    sec.version += 1;
    await sec.save();
    await AuditService.log(req.user._id, req.user.role, 'SecurityPasswordChange', 'security_settings', sec._id, {}, { passwordChanged: true }, req);
    return res.json({ success: true });
  } catch (e) {
  console.log('PUT password error', e);
    return res.status(500).json({ error: 'Failed to change password' });
  }
});

router.put('/:userId/security/2fa', assertSelf, async (req, res) => {
  try {
    const { enable, type } = req.body || {};
    const sec = await ensure(SecuritySettings, req.user._id);
    if (typeof enable !== 'boolean') return res.status(400).json({ error: 'enable must be boolean' });
    if (enable) {
      if (!['App','SMS','Email'].includes(type)) return res.status(400).json({ error: 'Invalid 2FA type' });
      sec.twoFactorEnabled = true;
      sec.twoFactorType = type;
    } else {
      sec.twoFactorEnabled = false;
      sec.twoFactorType = null;
    }
    sec.version += 1;
    await sec.save();
    await AuditService.log(req.user._id, req.user.role, 'TwoFactorEnabled', 'security_settings', sec._id, { enabled: sec.twoFactorEnabled, type: sec.twoFactorType }, null, req);
    return res.json({ success: true, security: { twoFactorEnabled: sec.twoFactorEnabled, twoFactorType: sec.twoFactorType, version: sec.version } });
  } catch (e) {
  console.log('PUT 2fa error', e);
    return res.status(500).json({ error: 'Failed to update 2FA' });
  }
});

export default router;
