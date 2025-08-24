import express from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import PaymentIntent from '../models/PaymentIntent.js';
import Payment from '../models/Payment.js';
import AuditService from '../services/AuditService.js';

const router = express.Router();
router.use(authenticate);

// POST /api/checkout/intents
router.post('/intents', async (req, res) => {
  try {
    const { amount, currency = 'USD', provider, method, quoteId, appointmentId } = req.body || {};
    if (!amount || !method) return res.status(400).json({ error: 'amount and method are required' });
    const intent = await PaymentIntent.create({ userId: req.user._id, quoteId, appointmentId, amount, currency, provider, method, status: 'Pending' });
    await AuditService.log(req.user._id, req.user.role, 'payment_intent_created', 'payment_intent', intent._id, { amount, provider, method }, null, req);
    res.status(201).json({ intent });
  } catch (e) {
    console.log('POST /api/checkout/intents error', e);
    res.status(500).json({ error: 'Failed to create payment intent' });
  }
});

// Provider inits (stubs)
router.post('/mpesa/stk-push', async (req, res) => {
  try {
    const { intentId, phone } = req.body || {};
    if (!intentId || !phone) return res.status(400).json({ error: 'intentId and phone required' });
    res.json({ ok: true, provider: 'M-Pesa', intentId, phone });
  } catch (e) { console.log('M-Pesa init error', e); res.status(500).json({ error: 'Failed to init M-Pesa' }); }
});
router.post('/telebirr/init', async (req, res) => {
  try {
    const { intentId, phone } = req.body || {};
    if (!intentId || !phone) return res.status(400).json({ error: 'intentId and phone required' });
    res.json({ ok: true, provider: 'Telebirr', intentId, phone });
  } catch (e) { console.log('Telebirr init error', e); res.status(500).json({ error: 'Failed to init Telebirr' }); }
});
router.post('/bank/init', async (req, res) => {
  try {
    const { intentId, bankCode } = req.body || {};
    if (!intentId || !bankCode) return res.status(400).json({ error: 'intentId and bankCode required' });
    res.json({ ok: true, provider: 'Bank', intentId, bankCode });
  } catch (e) { console.log('Bank init error', e); res.status(500).json({ error: 'Failed to init bank payment' }); }
});

// Webhook placeholder
router.post('/webhooks/payment/:provider', async (req, res) => {
  try {
    const { provider } = req.params;
    // TODO: verify signature, idempotency
    await AuditService.log(req.user._id, req.user.role, 'payment_webhook_received', 'payment', null, { provider }, null, req);
    res.json({ received: true, provider });
  } catch (e) {
    console.log('Webhook error', e);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// Payments list and refunds
router.get('/payments', async (req, res) => {
  try {
  const { appointmentId, userId } = req.query;
  const filter = {};
    if (appointmentId) filter.appointmentId = appointmentId;
  if (userId) filter.userId = userId; else filter.userId = req.user._id;
    const items = await Payment.find(filter).sort({ createdAt: -1 });
    res.json({ items });
  } catch (e) {
    console.log('Payments list error', e);
    res.status(500).json({ error: 'Failed to load payments' });
  }
});

export default router;
