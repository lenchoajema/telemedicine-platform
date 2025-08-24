import express from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import Invoice from '../models/Invoice.js';
import AuditService from '../services/AuditService.js';

const router = express.Router();
router.use(authenticate);

router.get('/', async (req, res) => {
  try {
    const items = await Invoice.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json({ items });
  } catch (e) { console.log('GET /api/invoices error', e); res.status(500).json({ error: 'Failed to load invoices' }); }
});

router.get('/:id', async (req, res) => {
  try {
    const invoice = await Invoice.findOne({ _id: req.params.id, userId: req.user._id });
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
    res.json({ invoice });
  } catch (e) { console.log('GET /api/invoices/:id error', e); res.status(500).json({ error: 'Failed to load invoice' }); }
});

router.post('/:id/finalize', async (req, res) => {
  try {
    const invoice = await Invoice.findOneAndUpdate({ _id: req.params.id, userId: req.user._id }, { $set: { status: 'Open' } }, { new: true });
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
    await AuditService.log(req.user._id, req.user.role, 'invoice_finalized', 'invoice', invoice._id, {}, null, req);
    res.json({ invoice });
  } catch (e) { console.log('POST /api/invoices/:id/finalize error', e); res.status(500).json({ error: 'Failed to finalize invoice' }); }
});

export default router;
