import express from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import PaymentMethod from '../models/PaymentMethod.js';
import AuditService from '../services/AuditService.js';

const router = express.Router();
router.use(authenticate);

// List payment methods
router.get('/methods', async (req, res) => {
  try {
    const items = await PaymentMethod.find({ userId: req.user._id }).sort({ isDefault: -1, createdAt: -1 });
    res.json({ items });
  } catch (e) {
    console.log('GET /api/billing/methods error', e);
    res.status(500).json({ error: 'Failed to load payment methods' });
  }
});

// Add a payment method (tokenized info assumed)
router.post('/methods', async (req, res) => {
  try {
    const payload = { ...req.body, userId: req.user._id };
    // Normalize aliases & nested billing address
    if (payload.cardholderName && !payload.billingName) payload.billingName = payload.cardholderName;
    if (payload.billingAddress && typeof payload.billingAddress === 'object') {
      const { line1, city, state, postalCode, country } = payload.billingAddress;
      payload.billingAddress = line1 || payload.billingAddress;
      payload.city = city || payload.city;
      payload.state = state || payload.state;
      payload.postalCode = postalCode || payload.postalCode;
      payload.country = country || payload.country;
    }
    if (payload.isDefault) {
      await PaymentMethod.updateMany({ userId: req.user._id, isDefault: true }, { $set: { isDefault: false } });
    }
    const item = await PaymentMethod.create(payload);
    await AuditService.log(req.user._id, req.user.role, 'payment_method_added', 'payment_method', item._id, {}, null, req);
    res.status(201).json({ item });
  } catch (e) {
    console.log('POST /api/billing/methods error', e);
    res.status(500).json({ error: 'Failed to add payment method' });
  }
});

// Update payment method
router.put('/methods/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = { ...req.body };
    if (updates.cardholderName && !updates.billingName) updates.billingName = updates.cardholderName;
    if (updates.billingAddress && typeof updates.billingAddress === 'object') {
      const { line1, city, state, postalCode, country } = updates.billingAddress;
      updates.billingAddress = line1 || updates.billingAddress;
      updates.city = city || updates.city;
      updates.state = state || updates.state;
      updates.postalCode = postalCode || updates.postalCode;
      updates.country = country || updates.country;
    }
    if (updates.isDefault) {
      await PaymentMethod.updateMany({ userId: req.user._id, isDefault: true }, { $set: { isDefault: false } });
    }
    const item = await PaymentMethod.findOneAndUpdate({ _id: id, userId: req.user._id }, { $set: updates }, { new: true });
    if (!item) return res.status(404).json({ error: 'Payment method not found' });
    await AuditService.log(req.user._id, req.user.role, 'payment_method_updated', 'payment_method', item._id, {}, null, req);
    res.json({ item });
  } catch (e) {
    console.log('PUT /api/billing/methods/:id error', e);
    res.status(500).json({ error: 'Failed to update payment method' });
  }
});

// Delete payment method
router.delete('/methods/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const item = await PaymentMethod.findOneAndDelete({ _id: id, userId: req.user._id });
    if (!item) return res.status(404).json({ error: 'Payment method not found' });
    await AuditService.log(req.user._id, req.user.role, 'payment_method_removed', 'payment_method', item._id, {}, null, req);
    res.json({ success: true });
  } catch (e) {
    console.log('DELETE /api/billing/methods/:id error', e);
    res.status(500).json({ error: 'Failed to delete payment method' });
  }
});

export default router;
