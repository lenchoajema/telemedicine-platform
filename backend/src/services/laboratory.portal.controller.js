import Laboratory from '../modules/labs/laboratory.model.js';
import LabTestCatalog from '../modules/labs/lab-test-catalog.model.js';
import LabExamination from '../modules/patients/lab-examination.model.js';
import NotificationService from '../services/NotificationService.js';
import { inc } from '../services/metrics.service.js';

const badRequest = (res, errors) => res.status(400).json({ success: false, errors });

export const registerLaboratory = async (req, res) => {
  try {
  const { name, address, city, state, country, phone, geoJSON, hoursJSON } = req.body || {};
  if (!name) return badRequest(res, [{ field: 'name', message: 'name is required' }]);
    const exists = await Laboratory.findOne({ ownerUserId: req.user._id });
    if (exists) return res.status(400).json({ success: false, message: 'Laboratory already registered for this account' });
  const row = await Laboratory.create({ name, address, city, state, country, phone, geoJSON, hoursJSON, ownerUserId: req.user._id, verificationStatus: 'Pending' });
  try { inc('lab_register_total'); } catch { /* noop */ }
    res.status(201).json({ success: true, data: row });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to register laboratory', error: error.message });
  }
};

export const getMyLaboratory = async (req, res) => {
  const row = await Laboratory.findOne({ ownerUserId: req.user._id });
  if (!row) return res.status(404).json({ success: false, message: 'No laboratory profile' });
  res.json({ success: true, data: row });
};

export const updateMyLaboratory = async (req, res) => {
  try {
    const update = req.body || {};
    const row = await Laboratory.findOneAndUpdate({ ownerUserId: req.user._id }, { $set: update }, { new: true });
    if (!row) return res.status(404).json({ success: false, message: 'No laboratory profile' });
    res.json({ success: true, data: row });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update laboratory', error: error.message });
  }
};

export const listMyCatalog = async (req, res) => {
  const lab = await Laboratory.findOne({ ownerUserId: req.user._id });
  if (!lab) return res.status(404).json({ success: false, message: 'No laboratory profile' });
  const page = Math.max(parseInt(req.query.page || '1', 10), 1);
  const pageSize = Math.min(Math.max(parseInt(req.query.pageSize || '50', 10), 1), 500);
  const sort = req.query.sort || 'testCode';
  const q = { labId: lab._id };
  const [items, total] = await Promise.all([
    LabTestCatalog.find(q).sort(sort).skip((page - 1) * pageSize).limit(pageSize),
    LabTestCatalog.countDocuments(q)
  ]);
  try { inc('lab_catalog_list_total'); } catch { /* noop */ }
  res.json({ success: true, data: items, page, pageSize, sort, total });
};

export const upsertCatalogItems = async (req, res) => {
  try {
    const lab = await Laboratory.findOne({ ownerUserId: req.user._id });
    if (!lab) return res.status(404).json({ success: false, message: 'No laboratory profile' });
    const items = Array.isArray(req.body) ? req.body : [req.body];
    const results = [];
    for (const it of items) {
  const { testCode, testName, price, currency, tatHours, technology, sampleRequirements, isActive } = it || {};
  if (!testCode) return badRequest(res, [{ field: 'testCode', message: 'testCode is required' }]);
  if (price != null && Number.isNaN(Number(price))) return badRequest(res, [{ field: 'price', message: 'price must be number' }]);
      const filter = { labId: lab._id, testCode };
      const update = { $set: { testName, price, currency, tatHours, technology, sampleRequirements, isActive } };
      const row = await LabTestCatalog.findOneAndUpdate(filter, update, { new: true, upsert: true, setDefaultsOnInsert: true });
      results.push(row);
    }
  try { inc('lab_catalog_upsert_total', results.length || 1); } catch { /* noop */ }
  res.status(201).json({ success: true, data: results });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to upsert catalog', error: error.message });
  }
};

export const listLabOrders = async (req, res) => {
  try {
    const lab = await Laboratory.findOne({ ownerUserId: req.user._id });
    if (!lab) return res.status(404).json({ success: false, message: 'No laboratory profile' });
  const { status } = req.query;
  const page = Math.max(parseInt(req.query.page || '1', 10), 1);
  const pageSize = Math.min(Math.max(parseInt(req.query.pageSize || '50', 10), 1), 200);
  const sort = req.query.sort || '-createdAt';
  const filter = { labId: lab._id };
  if (status) filter.status = status;
    const [items, total] = await Promise.all([
      LabExamination.find(filter).sort(sort).skip((page - 1) * pageSize).limit(pageSize),
      LabExamination.countDocuments(filter)
    ]);
  try { inc('lab_orders_list_total'); } catch { /* noop */ }
  res.json({ success: true, data: items, page, pageSize, sort, status: status || null, total });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to list lab orders', error: error.message });
  }
};

async function setLabOrderStatus(req, res, status, extra = {}, overrideEventType = null) {
  const lab = await Laboratory.findOne({ ownerUserId: req.user._id });
  if (!lab) return res.status(404).json({ success: false, message: 'No laboratory profile' });
  const { labExamId } = req.params;
  const row = await LabExamination.findOne({ _id: labExamId, labId: lab._id });
  if (!row) return res.status(404).json({ success: false, message: 'Lab order not found' });
  Object.assign(row, { status }, extra);
  await row.save();
  const map = {
    'in-progress': 'LabOrderAccepted',
    'completed': 'LabOrderCompleted',
    'cancelled': 'LabOrderCancelled'
  };
  const eventType = overrideEventType || map[status] || 'LabOrderUpdated';
  const content = `Your lab order ${String(row._id)} status is now ${status}.`;
  if (row.patient) await NotificationService.dispatchEvent(eventType, content, row.patient);
  if (row.orderingPhysician) await NotificationService.dispatchEvent(eventType, `Patient lab order ${String(row._id)} is ${status}.`, row.orderingPhysician);
  try { inc('lab_order_transition_accepted_total'); } catch { /* noop */ }
  res.json({ success: true, data: row });
}

export const acceptLabOrder = (req, res) => setLabOrderStatus(req, res, 'in-progress');
export const uploadLabResults = (req, res) => {
  const body = req.body || {};
  let results = body.resultValuesJSON;
  if (!Array.isArray(results)) results = [];
  // Basic validation for results array
  const invalid = results.find(r => !r || typeof r.name !== 'string' || typeof r.value === 'undefined');
  if (invalid) return badRequest(res, [{ field: 'resultValuesJSON', message: 'Each result must include name and value' }]);
  try { inc('lab_results_upload_total'); } catch { /* noop */ }
  return setLabOrderStatus(req, res, 'in-progress', { results }, 'LabResultsUploaded');
};
export const completeLabOrder = (req, res) => { try { inc('lab_order_transition_completed_total'); } catch { /* noop */ } return setLabOrderStatus(req, res, 'completed', { completedAt: new Date() }); };
export const rejectLabOrder = (req, res) => { try { inc('lab_order_transition_rejected_total'); } catch { /* noop */ } return setLabOrderStatus(req, res, 'cancelled'); };
