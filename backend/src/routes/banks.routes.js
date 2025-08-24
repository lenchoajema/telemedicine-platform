import express from 'express';
import Bank from '../models/Bank.js';
import BankBranch from '../models/BankBranch.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { syncBanksFromProvider } from '../services/bankProviders.service.js';
import ProviderSyncLog from '../models/ProviderSyncLog.js';
import mongoose from 'mongoose';

const router = express.Router();
router.use(authenticate);

function requireAdmin(req, res) {
  if (!req.user || req.user.role !== 'admin') {
    res.status(403).json({ error: 'Admin only' });
    return false;
  }
  return true;
}

// GET /api/banks
router.get('/', async (req, res) => {
  try {
    const { country, search, channel } = req.query;
    const filter = {};
    if (country) filter.countryIso2 = country.toUpperCase();
    if (channel) filter.supportedChannels = channel;
    if (search) filter.name = new RegExp(search, 'i');
    const items = await Bank.find(filter).sort({ name: 1 }).limit(500);
    res.json({ items });
  } catch (e) {
    console.log('GET /api/banks error', e);
    res.status(500).json({ error: 'Failed to load banks' });
  }
});

// GET /api/banks/:id
router.get('/:id', async (req, res) => {
  try {
    const bank = await Bank.findById(req.params.id);
    if (!bank) return res.status(404).json({ error: 'Bank not found' });
    const branches = await BankBranch.find({ bankId: bank._id }).limit(200);
    res.json({ bank, branches });
  } catch (e) {
    console.log('GET /api/banks/:id error', e);
    res.status(500).json({ error: 'Failed to load bank' });
  }
});

// POST /api/banks/sync/:provider?country=ET
router.post('/sync/:provider', async (req, res) => {
  try {
    if (!requireAdmin(req, res)) return;
    const { provider } = req.params;
    const { country } = req.query;
    const upsertFn = async (b) => {
      const existing = await Bank.findOne({ name: b.name, countryIso2: b.countryIso2 });
      if (!existing) {
        const created = await Bank.create({ ...b, status: 'Active' });
        created.__isNew = true; // marker for counts
        return created;
      }
      const updated = await Bank.findByIdAndUpdate(existing._id, { $set: { ...b, updatedAt: new Date() } }, { new: true });
      return updated;
    };
    const result = await syncBanksFromProvider(provider, { countryIso2: country }, upsertFn);
    res.json({ ok: true, ...result });
  } catch (e) {
    console.log('POST /api/banks/sync error', e);
    res.status(500).json({ error: 'Failed to sync banks' });
  }
});

// GET /api/banks/providers/:provider/raw?country=ET (stub)
router.get('/providers/:provider/raw', async (req, res) => {
  try {
    if (!requireAdmin(req, res)) return;
    const { provider } = req.params;
    const { country } = req.query;
    res.json({ provider, country, items: [] });
  } catch (e) {
    console.log('GET /api/banks/providers/:provider/raw error', e);
    res.status(500).json({ error: 'Failed to load provider raw data' });
  }
});

// GET /api/banks/logs?provider=&country=&from=&to=&cursor=&limit=
router.get('/logs', async (req, res) => {
  try {
    if (!requireAdmin(req, res)) return;
    const { provider, country, from, to, cursor, limit } = req.query;
    const q = {};
    if (provider) q.provider = String(provider);
    if (country) q.countryIso2 = String(country).toUpperCase();
    const time = {};
    if (from) {
      const d = new Date(from);
      if (isNaN(d.getTime())) return res.status(400).json({ error: 'from must be a valid date' });
      time.$gte = d;
    }
    if (to) {
      const d = new Date(to);
      if (isNaN(d.getTime())) return res.status(400).json({ error: 'to must be a valid date' });
      time.$lte = d;
    }
    if (Object.keys(time).length) q.createdAt = time;
    if (cursor) {
      try {
        q._id = { $lt: new mongoose.Types.ObjectId(String(cursor)) };
      } catch {
        return res.status(400).json({ error: 'Invalid cursor' });
      }
    }
    const pageSize = Math.max(1, Math.min(100, parseInt(limit || '20')));
    const items = await ProviderSyncLog.find(q).sort({ _id: -1 }).limit(pageSize + 1);
    const slice = items.slice(0, pageSize);
    const nextCursor = items.length > pageSize ? String(slice[slice.length - 1]._id) : null;
    res.json({ items: slice, nextCursor });
  } catch (e) {
    console.log('GET /api/banks/logs error', e);
    res.status(500).json({ error: 'Failed to load logs' });
  }
});

// GET /api/banks/logs/:id
router.get('/logs/:id', async (req, res) => {
  try {
    if (!requireAdmin(req, res)) return;
    const item = await ProviderSyncLog.findById(req.params.id);
    if (!item) return res.status(404).json({ error: 'Log not found' });
    res.json({ item });
  } catch (e) {
    console.log('GET /api/banks/logs/:id error', e);
    res.status(500).json({ error: 'Failed to load log' });
  }
});

export default router;
