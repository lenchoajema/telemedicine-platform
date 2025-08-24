import express from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import User from '../models/User.js';
import FamilyGroup from '../models/FamilyGroup.js';
import UserSettings from '../models/UserSettings.js';
import AuditService from '../services/AuditService.js';

const router = express.Router();
router.use(authenticate);

async function getOrCreateGroup(userId){
  let group = await FamilyGroup.findOne({ ownerId: userId });
  if (!group) {
    group = await FamilyGroup.create({ ownerId: userId, members: [{ userId, role: 'owner', status: 'active' }] });
  }
  return group;
}

// GET current user's family group
router.get('/', async (req, res) => {
  try {
    const group = await FamilyGroup.findOne({ ownerId: req.user._id }).populate('members.userId', 'username email profile role');
    if (!group) return res.json({ group: null, members: [] });
    return res.json({ group, members: group.members });
  } catch (e) {
  console.log('GET /api/family error', e);
    return res.status(500).json({ error: 'Failed to load family group' });
  }
});

// Health ping for mount verification
router.get('/_ping', (req, res) => {
  res.json({ ok: true, route: 'family', ts: new Date().toISOString() });
});

// POST add an adult member by userId (e.g., spouse)
router.post('/members', async (req, res) => {
  try {
    const { userId, role = 'adult' } = req.body || {};
    if (!userId) return res.status(400).json({ error: 'userId is required' });
    if (!['adult', 'dependent'].includes(role)) return res.status(400).json({ error: 'Invalid role' });
    const group = await getOrCreateGroup(req.user._id);
    const exists = group.members.some(m => String(m.userId) === String(userId));
    if (exists) return res.status(409).json({ error: 'Member already in household' });
    group.members.push({ userId, role, status: 'active' });
    await group.save();
    await group.populate('members.userId', 'username email profile role');
    await AuditService.log(req.user._id, req.user.role, 'family_member_added', 'family_group', group._id, { userId, role }, null, req);
    return res.status(201).json({ group, members: group.members });
  } catch (e) {
    console.log('POST /api/family/members error', e);
    return res.status(500).json({ error: 'Failed to add family member' });
  }
});

// POST add a dependent child by basic info (creates placeholder User?)
// Minimal: require an existing userId for now to avoid creating users here
router.post('/children', async (req, res) => {
  try {
    const { userId } = req.body || {};
    if (!userId) return res.status(400).json({ error: 'userId is required' });
    const group = await getOrCreateGroup(req.user._id);
    const exists = group.members.some(m => String(m.userId) === String(userId));
    if (exists) return res.status(409).json({ error: 'Member already in household' });
    group.members.push({ userId, role: 'dependent', status: 'active' });
    await group.save();
    await group.populate('members.userId', 'username email profile role');
    await AuditService.log(req.user._id, req.user.role, 'family_member_added', 'family_group', group._id, { userId, role: 'dependent' }, null, req);
    return res.status(201).json({ group, members: group.members });
  } catch (e) {
    console.log('POST /api/family/children error', e);
    return res.status(500).json({ error: 'Failed to add child' });
  }
});

// POST create group (idempotent)
router.post('/groups', async (req, res) => {
  try {
    const group = await getOrCreateGroup(req.user._id);
  await AuditService.log(req.user._id, req.user.role, 'family_group_created', 'family_group', group._id, {}, null, req);
    return res.status(201).json({ group });
  } catch (e) {
  console.log('POST /api/family/groups error', e);
    return res.status(500).json({ error: 'Failed to create family group' });
  }
});

// PATCH set acting-as user (must be self or household member)
router.patch('/acting-as', async (req, res) => {
  try {
    const { userId } = req.body || {};
    // If clearing acting-as, allow immediately
    if (!userId) {
      const settings = await UserSettings.findOneAndUpdate(
        { userId: req.user._id },
        { $set: { actingAsUserId: null } },
        { upsert: true, new: true }
      );
      await AuditService.log(req.user._id, req.user.role, 'set_acting_as', 'user_settings', settings._id, { actingAsUserId: null }, null, req);
      return res.json({ success: true, actingAsUserId: null });
    }
    const group = await getOrCreateGroup(req.user._id);
    const isMember = group.members.some(m => m.userId.toString() === String(userId));
    if (!isMember && String(userId) !== String(req.user._id)) {
      return res.status(403).json({ error: 'Target user is not in your household' });
    }
    const settings = await UserSettings.findOneAndUpdate(
      { userId: req.user._id },
      { $set: { actingAsUserId: userId || null } },
      { upsert: true, new: true }
    );
    await AuditService.log(req.user._id, req.user.role, 'set_acting_as', 'user_settings', settings._id, { actingAsUserId: userId || null }, null, req);
    return res.json({ success: true, actingAsUserId: settings.actingAsUserId });
  } catch (e) {
  console.log('PATCH /api/family/acting-as error', e);
    return res.status(500).json({ error: 'Failed to update acting-as user' });
  }
});

// POST add member by email (helper)
// Helper to add by email (alias support)
// Handler to add member by email
async function addByEmail(req, res) {
  try {
    const { email, role = 'adult' } = req.body || {};
    if (!email) return res.status(400).json({ error: 'email is required' });
    if (!['adult', 'dependent'].includes(role)) return res.status(400).json({ error: 'Invalid role' });
    const user = await User.findOne({ email: String(email).toLowerCase().trim() });
    if (!user) return res.status(404).json({ error: 'User not found' });
    const group = await getOrCreateGroup(req.user._id);
    const exists = group.members.some(m => String(m.userId) === String(user._id));
    if (exists) return res.status(409).json({ error: 'Member already in household' });
    group.members.push({ userId: user._id, role, status: 'active' });
    await group.save();
    await group.populate('members.userId', 'username email profile role');
    await AuditService.log(req.user._id, req.user.role, 'family_member_added', 'family_group', group._id, { userId: user._id, role }, null, req);
    return res.status(201).json({ group, members: group.members });
  } catch (e) {
    console.log('POST /api/family/members/by-email error', e);
    return res.status(500).json({ error: 'Failed to add family member by email' });
  }
}
// Export handler for fallback routes
export { addByEmail };

router.post('/members/by-email', addByEmail);
router.post('/member/by-email', addByEmail);

// DELETE remove a member from household (owner-only)
router.delete('/members/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const group = await FamilyGroup.findOne({ ownerId: req.user._id });
    if (!group) return res.status(404).json({ error: 'Household not found' });
    // Prevent removing owner
    const member = group.members.find(m => String(m.userId) === String(userId));
    if (!member) return res.status(404).json({ error: 'Member not found' });
    if (member.role === 'owner') return res.status(400).json({ error: 'Cannot remove household owner' });
    group.members = group.members.filter(m => String(m.userId) !== String(userId));
    await group.save();
    await group.populate('members.userId', 'username email profile role');
    await AuditService.log(req.user._id, req.user.role, 'family_member_removed', 'family_group', group._id, { userId }, null, req);
    return res.json({ group, members: group.members });
  } catch (e) {
    console.log('DELETE /api/family/members/:userId error', e);
    return res.status(500).json({ error: 'Failed to remove family member' });
  }
});

export default router;
