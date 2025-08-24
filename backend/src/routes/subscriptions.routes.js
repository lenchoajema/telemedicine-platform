import express from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import Plan from '../models/Plan.js';
import Subscription from '../models/Subscription.js';
import SubscriptionUsage from '../models/SubscriptionUsage.js';
import AuditService from '../services/AuditService.js';

const router = express.Router();
router.use(authenticate);

router.get('/plans', async (_req, res) => {
  try {
    const items = await Plan.find({ active: true }).sort({ price: 1 });
    res.json({ items });
  } catch (e) { console.log('GET /api/plans error', e); res.status(500).json({ error: 'Failed to load plans' }); }
});

router.post('/', async (req, res) => {
  try {
    const { planId, paymentMethodId, familyId } = req.body || {};
    if (!planId) return res.status(400).json({ error: 'planId is required' });
    const now = new Date();
    const sub = await Subscription.create({ ownerUserId: req.user._id, familyId, planId, status: 'Active', currentPeriodStart: now, currentPeriodEnd: new Date(now.getTime() + 30*24*3600*1000), paymentMethodId });
    await AuditService.log(req.user._id, req.user.role, 'subscription_created', 'subscription', sub._id, { planId }, null, req);
    res.status(201).json({ subscription: sub });
  } catch (e) { console.log('POST /api/subscriptions error', e); res.status(500).json({ error: 'Failed to create subscription' }); }
});

router.get('/:id', async (req, res) => {
  try {
    const sub = await Subscription.findOne({ _id: req.params.id, ownerUserId: req.user._id });
    if (!sub) return res.status(404).json({ error: 'Subscription not found' });
    res.json({ subscription: sub });
  } catch (e) { console.log('GET /api/subscriptions/:id error', e); res.status(500).json({ error: 'Failed to load subscription' }); }
});

router.patch('/:id/cancel', async (req, res) => {
  try {
    const sub = await Subscription.findOneAndUpdate({ _id: req.params.id, ownerUserId: req.user._id }, { $set: { status: 'Canceled' } }, { new: true });
    if (!sub) return res.status(404).json({ error: 'Subscription not found' });
    await AuditService.log(req.user._id, req.user.role, 'subscription_canceled', 'subscription', sub._id, {}, null, req);
    res.json({ subscription: sub });
  } catch (e) { console.log('PATCH /api/subscriptions/:id/cancel error', e); res.status(500).json({ error: 'Failed to cancel subscription' }); }
});

router.get('/:id/usage', async (req, res) => {
  try {
    const items = await SubscriptionUsage.find({ subscriptionId: req.params.id });
    res.json({ items });
  } catch (e) { console.log('GET /api/subscriptions/:id/usage error', e); res.status(500).json({ error: 'Failed to load usage' }); }
});

router.post('/:id/consume', async (req, res) => {
  try {
    const { appointmentId, units = 1 } = req.body || {};
    const usage = await SubscriptionUsage.create({ subscriptionId: req.params.id, appointmentId, units });
    await AuditService.log(req.user._id, req.user.role, 'subscription_usage_recorded', 'subscription', req.params.id, { appointmentId, units }, null, req);
    res.status(201).json({ usage });
  } catch (e) { console.log('POST /api/subscriptions/:id/consume error', e); res.status(500).json({ error: 'Failed to record usage' }); }
});

export default router;
