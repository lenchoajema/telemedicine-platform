import express from 'express';
import User from '../models/User.js';
import UserSettings from '../models/UserSettings.js';
import { authenticate } from '../middleware/auth.middleware.js';
import AuditService from '../services/AuditService.js';

const router = express.Router();

router.use(authenticate);

async function ensureSettings(userId){
  let s = await UserSettings.findOne({ userId });
  if (!s) s = await UserSettings.create({ userId });
  return s;
}

// GET personal settings (basic profile info)
router.get('/personal', async (req, res) => {
  try {
    const user = await User.findById(req.user._id).lean();
    const settings = await ensureSettings(req.user._id);
    return res.json({
      user: {
        username: user.username,
        email: user.email,
        role: user.role,
        profile: user.profile || {},
        timeZone: user.timeZone || 'UTC',
      },
      settings: {
        allowFamilyProxies: settings.allowFamilyProxies,
        actingAsUserId: settings.actingAsUserId,
      }
    });
  } catch (e) {
  console.log('GET /api/settings/personal error', e);
    return res.status(500).json({ error: 'Failed to load personal settings' });
  }
});

// PUT personal updates (profile, phone, name; email immutable for now)
router.put('/personal', async (req, res) => {
  try {
    const { profile, timeZone, allowFamilyProxies } = req.body || {};
    const updates = {};
    if (profile && typeof profile === 'object') {
      updates['profile'] = {
        ...(profile.firstName ? { firstName: profile.firstName } : {}),
        ...(profile.lastName ? { lastName: profile.lastName } : {}),
        ...(profile.phone ? { phone: profile.phone } : {}),
        ...(profile.photo ? { photo: profile.photo } : {}),
        ...(profile.dateOfBirth ? { dateOfBirth: profile.dateOfBirth } : {}),
        ...(profile.gender ? { gender: profile.gender } : {}),
        ...(profile.address ? { address: profile.address } : {}),
        ...(profile.city ? { city: profile.city } : {}),
        ...(profile.state ? { state: profile.state } : {}),
        ...(profile.zipCode ? { zipCode: profile.zipCode } : {}),
        ...(profile.emergencyContact ? { emergencyContact: profile.emergencyContact } : {}),
        ...(profile.emergencyPhone ? { emergencyPhone: profile.emergencyPhone } : {}),
      };
    }
    if (timeZone) updates['timeZone'] = timeZone;

    const user = await User.findByIdAndUpdate(req.user._id, { $set: updates }, { new: true });
    const settings = await ensureSettings(req.user._id);

    if (typeof allowFamilyProxies === 'boolean') {
      settings.allowFamilyProxies = allowFamilyProxies;
      await settings.save();
    }

    await AuditService.log(req.user._id, req.user.role, 'update_personal_settings', 'user', req.user._id, { fields: Object.keys(updates) }, null, req);

    return res.json({ success: true, user, settings });
  } catch (e) {
  console.log('PUT /api/settings/personal error', e);
    return res.status(500).json({ error: 'Failed to update personal settings' });
  }
});

// GET preferences & privacy
router.get('/preferences', async (req, res) => {
  try {
    const settings = await ensureSettings(req.user._id);
    return res.json({ preferences: settings.preferences, privacy: settings.privacy });
  } catch (e) {
  console.log('GET /api/settings/preferences error', e);
    return res.status(500).json({ error: 'Failed to load preferences' });
  }
});

// PUT preferences & privacy
router.put('/preferences', async (req, res) => {
  try {
    const { preferences, privacy } = req.body || {};
    const settings = await ensureSettings(req.user._id);
    if (preferences && typeof preferences === 'object') {
      const next = { ...settings.preferences.toObject?.() || settings.preferences, ...preferences };
      // Validate language as BCP 47 simple pattern
      if (next.language) {
        const bcp47 = /^[A-Za-z]{2,3}(-[A-Za-z]{2}|-[A-Za-z]{4})?(-[A-Za-z]{2}|-[0-9]{3})?$/;
        if (!bcp47.test(String(next.language))) {
          return res.status(400).json({ error: 'Invalid language tag. Use IETF BCP 47, e.g., am-ET' });
        }
      }
      settings.preferences = next;
    }
    if (privacy && typeof privacy === 'object') {
            // Ensure language is BCP 47-like if provided
            if (settings.preferences?.language) {
              settings.preferences.language = String(settings.preferences.language).trim();
            }
      settings.privacy = { ...settings.privacy.toObject?.() || settings.privacy, ...privacy };
    }
    await settings.save();
    await AuditService.log(req.user._id, req.user.role, 'update_preferences', 'user_settings', settings._id, {}, null, req);
    return res.json({ success: true, preferences: settings.preferences, privacy: settings.privacy });
  } catch (e) {
  console.log('PUT /api/settings/preferences error', e);
    return res.status(500).json({ error: 'Failed to update preferences' });
  }
});

export default router;
