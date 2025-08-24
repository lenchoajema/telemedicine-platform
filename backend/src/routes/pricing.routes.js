import express from 'express';
import mongoose from 'mongoose';
import { authenticate } from '../middleware/auth.middleware.js';
import ServiceCatalog from '../models/ServiceCatalog.js';
import PriceBook from '../models/PriceBook.js';
import Quote from '../models/Quote.js';
import AuditService from '../services/AuditService.js';
import Plan from '../models/Plan.js';

const router = express.Router();
router.use(authenticate);
// GET /api/pricing/price-books?region=&payerType=&effectiveOn=&cursor=&limit=
router.get('/price-books', async (req, res) => {
  try {
    const ISO2 = /^[A-Z]{2}$/;
    const { region, payerType, effectiveOn, cursor, limit } = req.query;
    const q = {};
    if (region) {
      const R = String(region).toUpperCase();
      if (!ISO2.test(R)) return res.status(400).json({ error: 'region must be ISO-2 (e.g., ET, KE)' });
      q.region = R;
    }
    if (payerType) {
      const allowed = ['SelfPay','Insurance','Corporate'];
      if (!allowed.includes(String(payerType))) return res.status(400).json({ error: 'Invalid payerType' });
      q.payerType = payerType;
    }
    // Effective date intersection: effectiveFrom <= date && (effectiveTo is null || date <= effectiveTo)
    if (effectiveOn) {
      const d = new Date(effectiveOn);
      if (isNaN(d.getTime())) return res.status(400).json({ error: 'effectiveOn must be a valid date' });
      q.$and = [
        { effectiveFrom: { $lte: d } },
        { $or: [ { effectiveTo: { $exists: false } }, { effectiveTo: null }, { effectiveTo: { $gte: d } } ] },
      ];
    }
    const pageSize = Math.max(1, Math.min(100, parseInt(limit || '20')));
    if (cursor) {
      // pagination by _id (PriceBookID) desc
      try {
        q._id = { $lt: new mongoose.Types.ObjectId(String(cursor)) };
      } catch {
        return res.status(400).json({ error: 'Invalid cursor' });
      }
    }
    const items = await PriceBook.find(q)
      .sort({ _id: -1 })
      .limit(pageSize + 1);
    let nextCursor = null;
    const slice = items.slice(0, pageSize);
    if (items.length > pageSize) {
      nextCursor = String(slice[slice.length - 1]._id);
    }
    res.json({ items: slice, nextCursor });
  } catch (e) {
    console.log('GET /api/pricing/price-books error', e);
    res.status(500).json({ error: 'Failed to load pricebooks' });
  }
});

// GET /api/pricing/services?region=&payerType=
router.get('/services', async (req, res) => {
  try {
    const { region, payerType } = req.query;
    const services = await ServiceCatalog.find({ active: true }).sort({ code: 1 });
    // Optionally adjust prices via latest pricebook
    let pricebook = null;
    if (region && payerType) {
      pricebook = await PriceBook.findOne({ region, payerType }).sort({ effectiveFrom: -1 });
    }
    const items = services.map(s => {
      const p = pricebook?.items?.find(i => String(i.serviceId) === String(s._id));
      return {
        _id: s._id,
        code: s.code,
        name: s.name,
        description: s.description,
        price: p?.unitPrice ?? s.defaultPrice,
        currency: s.currency,
        taxRate: p?.taxRate ?? 0,
      };
    });
    res.json({ items });
  } catch (e) {
    console.log('GET /api/pricing/services error', e);
    res.status(500).json({ error: 'Failed to load services' });
  }
});

// POST /api/pricing/quote
router.post('/quote', async (req, res) => {
  try {
    const { items = [], appointmentId, insurance } = req.body || {};
    const svcMap = new Map();
    const codes = items.map(i => i.serviceCode).filter(Boolean);
    if (codes.length) {
      const svcs = await ServiceCatalog.find({ code: { $in: codes } });
      svcs.forEach(s => svcMap.set(s.code, s));
    }
    const qItems = items.map(i => {
      const svc = svcMap.get(i.serviceCode) || {};
      const unitPrice = svc.defaultPrice || 0;
      const qty = i.qty || 1;
      const total = unitPrice * qty;
      return { serviceId: svc._id, serviceCode: i.serviceCode, name: svc.name, qty, unitPrice, taxRate: 0, total };
    });
    const subtotal = qItems.reduce((a, b) => a + (b.total || 0), 0);
    const taxes = 0; // extend with tax logic
    const estimatedInsurance = insurance ? Math.round(subtotal * 0.3) : 0; // naive estimate
    const patientResponsibility = Math.max(0, subtotal + taxes - estimatedInsurance);
    const quote = await Quote.create({ patientId: req.user._id, appointmentId, items: qItems, subtotal, taxes, estimatedInsurance, patientResponsibility, currency: 'USD', expiresAt: new Date(Date.now() + 24*3600*1000) });
    await AuditService.log(req.user._id, req.user.role, 'quote_created', 'quote', quote._id, { subtotal, patientResponsibility }, null, req);
    res.status(201).json({ quote });
  } catch (e) {
    console.log('POST /api/pricing/quote error', e);
    res.status(500).json({ error: 'Failed to create quote' });
  }
});

// GET /api/pricing/quotes/:id
router.get('/quotes/:id', async (req, res) => {
  try {
    const quote = await Quote.findOne({ _id: req.params.id, patientId: req.user._id });
    if (!quote) return res.status(404).json({ error: 'Quote not found' });
    res.json({ quote });
  } catch (e) {
    console.log('GET /api/pricing/quotes/:id error', e);
    res.status(500).json({ error: 'Failed to load quote' });
  }
});

// GET /api/pricing/quotes (list for current user)
router.get('/quotes', async (req, res) => {
  try {
    const items = await Quote.find({ patientId: req.user._id }).sort({ createdAt: -1 }).limit(50);
    res.json({ items });
  } catch (e) {
    console.log('GET /api/pricing/quotes error', e);
    res.status(500).json({ error: 'Failed to load quotes' });
  }
});

// --- Admin endpoints (simple scaffold) ---
const requireAdmin = (req, res) => {
  if (!req.user || req.user.role !== 'admin') {
    res.status(403).json({ error: 'Admin only' });
    return false;
  }
  return true;
};

// Services CRUD
router.get('/admin/services', async (req, res) => {
  try {
    if (!requireAdmin(req, res)) return;
    const items = await ServiceCatalog.find({}).sort({ code: 1 });
    res.json({ items });
  } catch (e) { console.log('GET /api/pricing/admin/services error', e); res.status(500).json({ error: 'Failed to load services' }); }
});
router.post('/admin/services', async (req, res) => {
  try {
    if (!requireAdmin(req, res)) return;
    const { code, name, description, defaultPrice, currency = 'USD', active = true } = req.body || {};
    if (!code || !name) return res.status(400).json({ error: 'code and name are required' });
    const created = await ServiceCatalog.create({ code, name, description, defaultPrice, currency, active });
    res.status(201).json({ item: created });
  } catch (e) { console.log('POST /api/pricing/admin/services error', e); res.status(500).json({ error: 'Failed to create service' }); }
});
router.patch('/admin/services/:id', async (req, res) => {
  try {
    if (!requireAdmin(req, res)) return;
    const update = req.body || {};
    const item = await ServiceCatalog.findByIdAndUpdate(req.params.id, { $set: update }, { new: true });
    if (!item) return res.status(404).json({ error: 'Service not found' });
    res.json({ item });
  } catch (e) { console.log('PATCH /api/pricing/admin/services/:id error', e); res.status(500).json({ error: 'Failed to update service' }); }
});
router.delete('/admin/services/:id', async (req, res) => {
  try {
    if (!requireAdmin(req, res)) return;
    await ServiceCatalog.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (e) { console.log('DELETE /api/pricing/admin/services/:id error', e); res.status(500).json({ error: 'Failed to delete service' }); }
});

// PriceBooks
router.get('/admin/pricebooks', async (req, res) => {
  try {
    if (!requireAdmin(req, res)) return;
    const page = Math.max(1, parseInt(req.query.page || '1'));
    const pageSize = Math.max(1, Math.min(100, parseInt(req.query.pageSize || '10')));
    const skip = (page - 1) * pageSize;
    const [items, total] = await Promise.all([
      PriceBook.find({})
        .sort({ region: 1, payerType: 1, effectiveFrom: -1 })
        .skip(skip)
        .limit(pageSize),
      PriceBook.countDocuments({}),
    ]);
    res.json({ items, page, pageSize, total });
  } catch (e) { console.log('GET /api/pricing/admin/pricebooks error', e); res.status(500).json({ error: 'Failed to load pricebooks' }); }
});
router.post('/admin/pricebooks', async (req, res) => {
  try {
    if (!requireAdmin(req, res)) return;
    const { region, payerType, items = [], effectiveFrom } = req.body || {};
    if (!region || !payerType) return res.status(400).json({ error: 'region and payerType are required' });
    const created = await PriceBook.create({ region, payerType, items, effectiveFrom: effectiveFrom ? new Date(effectiveFrom) : new Date() });
    res.status(201).json({ item: created });
  } catch (e) { console.log('POST /api/pricing/admin/pricebooks error', e); res.status(500).json({ error: 'Failed to create pricebook' }); }
});
router.patch('/admin/pricebooks/:id', async (req, res) => {
  try {
    if (!requireAdmin(req, res)) return;
    const update = req.body || {};
    const item = await PriceBook.findByIdAndUpdate(req.params.id, { $set: update }, { new: true });
    if (!item) return res.status(404).json({ error: 'PriceBook not found' });
    res.json({ item });
  } catch (e) { console.log('PATCH /api/pricing/admin/pricebooks/:id error', e); res.status(500).json({ error: 'Failed to update pricebook' }); }
});
router.delete('/admin/pricebooks/:id', async (req, res) => {
  try {
    if (!requireAdmin(req, res)) return;
    await PriceBook.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (e) { console.log('DELETE /api/pricing/admin/pricebooks/:id error', e); res.status(500).json({ error: 'Failed to delete pricebook' }); }
});

// Export PriceBook items as CSV
router.get('/admin/pricebooks/:id/export', async (req, res) => {
  try {
    if (!requireAdmin(req, res)) return;
    const pb = await PriceBook.findById(req.params.id);
    if (!pb) return res.status(404).json({ error: 'PriceBook not found' });
    const serviceIds = (pb.items || []).map(i => i.serviceId).filter(Boolean);
    const services = serviceIds.length ? await ServiceCatalog.find({ _id: { $in: serviceIds } }) : [];
    const codeMap = new Map(services.map(s => [String(s._id), s.code]));
    const header = 'serviceCode,unitPrice,taxRate';
    const lines = (pb.items || []).map(i => {
      const code = codeMap.get(String(i.serviceId)) || '';
      const unit = i.unitPrice ?? 0;
      const tax = i.taxRate ?? 0;
      return `${code},${unit},${tax}`;
    });
    const csv = [header, ...lines].join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="pricebook-${pb._id}.csv"`);
    res.send(csv);
  } catch (e) {
    console.log('GET /api/pricing/admin/pricebooks/:id/export error', e);
    res.status(500).json({ error: 'Failed to export CSV' });
  }
});

// Import PriceBook items from CSV
router.post('/admin/pricebooks/:id/import', async (req, res) => {
  try {
    if (!requireAdmin(req, res)) return;
    const { csv } = req.body || {};
    if (!csv || typeof csv !== 'string') return res.status(400).json({ error: 'csv body is required' });
    const lines = csv.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    if (!lines.length) return res.status(400).json({ error: 'No CSV content' });
    // header
    const header = lines.shift();
    const cols = (header || '').split(',').map(s => s.trim().toLowerCase());
    const idxCode = cols.indexOf('servicecode');
    const idxUnit = cols.indexOf('unitprice');
    const idxTax = cols.indexOf('taxrate');
    if (idxCode === -1 || idxUnit === -1) return res.status(400).json({ error: 'CSV must include serviceCode and unitPrice headers' });
    const rows = lines.map(l => l.split(',').map(s => s.trim()));
    const codes = rows.map(r => r[idxCode]).filter(Boolean);
    const svcList = codes.length ? await ServiceCatalog.find({ code: { $in: codes } }) : [];
    const svcMap = new Map(svcList.map(s => [s.code, s]));
    const items = [];
    const errors = [];
    for (const r of rows) {
      const code = r[idxCode];
      const unit = Number(r[idxUnit] || 0);
      const tax = idxTax !== -1 ? Number(r[idxTax] || 0) : 0;
      const svc = svcMap.get(code);
      if (!svc) { errors.push(`Unknown serviceCode: ${code}`); continue; }
      items.push({ serviceId: svc._id, unitPrice: isNaN(unit) ? 0 : unit, taxRate: isNaN(tax) ? 0 : tax, discount: {} });
    }
    const updated = await PriceBook.findByIdAndUpdate(req.params.id, { $set: { items } }, { new: true });
    if (!updated) return res.status(404).json({ error: 'PriceBook not found' });
    res.json({ ok: true, updated: items.length, errors });
  } catch (e) {
    console.log('POST /api/pricing/admin/pricebooks/:id/import error', e);
    res.status(500).json({ error: 'Failed to import CSV' });
  }
});

// Plans
router.get('/admin/plans', async (req, res) => {
  try {
    if (!requireAdmin(req, res)) return;
    const items = await Plan.find({}).sort({ name: 1 });
    res.json({ items });
  } catch (e) { console.log('GET /api/pricing/admin/plans error', e); res.status(500).json({ error: 'Failed to load plans' }); }
});
router.post('/admin/plans', async (req, res) => {
  try {
    if (!requireAdmin(req, res)) return;
    const { name, price, interval = 'month', currency = 'USD', description } = req.body || {};
    if (!name || price == null) return res.status(400).json({ error: 'name and price are required' });
    const item = await Plan.create({ name, price, interval, currency, description, active: true });
    res.status(201).json({ item });
  } catch (e) { console.log('POST /api/pricing/admin/plans error', e); res.status(500).json({ error: 'Failed to create plan' }); }
});
router.patch('/admin/plans/:id', async (req, res) => {
  try {
    if (!requireAdmin(req, res)) return;
    const update = req.body || {};
    const item = await Plan.findByIdAndUpdate(req.params.id, { $set: update }, { new: true });
    if (!item) return res.status(404).json({ error: 'Plan not found' });
    res.json({ item });
  } catch (e) { console.log('PATCH /api/pricing/admin/plans/:id error', e); res.status(500).json({ error: 'Failed to update plan' }); }
});
router.delete('/admin/plans/:id', async (req, res) => {
  try {
    if (!requireAdmin(req, res)) return;
    await Plan.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (e) { console.log('DELETE /api/pricing/admin/plans/:id error', e); res.status(500).json({ error: 'Failed to delete plan' }); }
});

export default router;
