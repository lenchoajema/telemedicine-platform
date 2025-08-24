import express from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import Insurance from '../models/Insurance.js';
import AuditService from '../services/AuditService.js';

const router = express.Router();
router.use(authenticate);

// List insurances for current user
router.get('/', async (req, res) => {
  try {
    const items = await Insurance.find({ userId: req.user._id }).sort({ isPrimary: -1, createdAt: -1 });
    res.json({ items });
  } catch (e) {
    console.log('GET /api/insurance error', e);
    res.status(500).json({ error: 'Failed to load insurance' });
  }
});

// Set primary policy
router.post('/:id/primary', async (req, res) => {
  try {
    const policy = await Insurance.findOne({ _id: req.params.id, userId: req.user._id });
    if (!policy) return res.status(404).json({ success: false, error: 'Policy not found' });
    if (policy.isPrimary) return res.json({ success: true, insurance: policy });
    await Insurance.updateMany({ userId: req.user._id, isPrimary: true }, { $set: { isPrimary: false } });
    policy.isPrimary = true;
    await policy.save();
  try { await AuditService.log(req.user._id, req.user.role, 'InsurancePolicyPrimarySwitch', 'insurance', policy._id, {}, null, req); } catch { /* audit optional */ }
    return res.json({ success: true, insurance: policy });
  } catch {
    return res.status(500).json({ success: false, error: 'Failed to set primary policy' });
  }
});

// Create or add insurance
router.post('/', async (req, res) => {
  try {
  const payload = { ...req.body, userId: req.user._id };
  // Normalize aliases
  if (payload.plan && !payload.planName) payload.planName = payload.plan;
    if (payload.isPrimary) {
      await Insurance.updateMany({ userId: req.user._id, isPrimary: true }, { $set: { isPrimary: false } });
    }
    const item = await Insurance.create(payload);
    await AuditService.log(req.user._id, req.user.role, 'insurance_added', 'insurance', item._id, {}, null, req);
    res.status(201).json({ item });
  } catch (e) {
    console.log('POST /api/insurance error', e);
    res.status(500).json({ error: 'Failed to add insurance' });
  }
});

// Update
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
  const updates = { ...req.body };
  if (updates.plan && !updates.planName) updates.planName = updates.plan;
    if (updates.isPrimary) {
      await Insurance.updateMany({ userId: req.user._id, isPrimary: true }, { $set: { isPrimary: false } });
    }
    const item = await Insurance.findOneAndUpdate({ _id: id, userId: req.user._id }, { $set: updates }, { new: true });
    if (!item) return res.status(404).json({ error: 'Insurance not found' });
    await AuditService.log(req.user._id, req.user.role, 'insurance_updated', 'insurance', item._id, {}, null, req);
    res.json({ item });
  } catch (e) {
    console.log('PUT /api/insurance/:id error', e);
    res.status(500).json({ error: 'Failed to update insurance' });
  }
});

// Delete
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const item = await Insurance.findOneAndDelete({ _id: id, userId: req.user._id });
    if (!item) return res.status(404).json({ error: 'Insurance not found' });
    await AuditService.log(req.user._id, req.user.role, 'insurance_removed', 'insurance', item._id, {}, null, req);
    res.json({ success: true });
  } catch (e) {
    console.log('DELETE /api/insurance/:id error', e);
    res.status(500).json({ error: 'Failed to delete insurance' });
  }
});

export default router;
