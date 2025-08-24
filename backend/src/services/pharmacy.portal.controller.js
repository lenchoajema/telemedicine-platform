import mongoose from 'mongoose';
import Pharmacy from '../modules/erx/pharmacy.model.js';
import { inc } from '../services/metrics.service.js';
import PharmacyInventory from '../modules/erx/pharmacy-inventory.model.js';
import PharmacyStockMovement from '../modules/erx/pharmacy-stock-movement.model.js';
import PharmacyOrder from '../modules/erx/pharmacy-order.model.js';
import NotificationService from '../services/NotificationService.js';
import AuditService from '../services/AuditService.js';
import Prescription from '../modules/patients/prescriptions.model.js';
import { getIO } from '../services/socket.service.js';
import { ChatMessage } from '../modules/chats/chat.model.js';

const badRequest = (res, errors) => res.status(400).json({ success: false, errors });

export const registerPharmacy = async (req, res) => {
  try {
  const { name, address, city, state, country, phone, geoJSON, hoursJSON } = req.body || {};
  if (!name) return badRequest(res, [{ field: 'name', message: 'name is required' }]);
    const exists = await Pharmacy.findOne({ ownerUserId: req.user._id });
    if (exists) return res.status(400).json({ success: false, message: 'Pharmacy already registered for this account' });
    const row = await Pharmacy.create({ name, address, city, state, country, phone, geoJSON, hoursJSON, ownerUserId: req.user._id, verificationStatus: 'Pending' });
  try { inc('pharmacy_register_total'); } catch { /* noop */ }
    res.status(201).json({ success: true, data: row });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to register pharmacy', error: error.message });
  }
};

export const getMyPharmacy = async (req, res) => {
  const row = await Pharmacy.findOne({ ownerUserId: req.user._id });
  if (!row) return res.status(404).json({ success: false, message: 'No pharmacy profile' });
  res.json({ success: true, data: row });
};

export const updateMyPharmacy = async (req, res) => {
  try {
  const update = req.body || {};
    const row = await Pharmacy.findOneAndUpdate({ ownerUserId: req.user._id }, { $set: update }, { new: true });
    if (!row) return res.status(404).json({ success: false, message: 'No pharmacy profile' });
    res.json({ success: true, data: row });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update pharmacy', error: error.message });
  }
};

export const listMyInventory = async (req, res) => {
  const myPharmacy = await Pharmacy.findOne({ ownerUserId: req.user._id });
  if (!myPharmacy) return res.status(404).json({ success: false, message: 'No pharmacy profile' });
  const page = Math.max(parseInt(req.query.page || '1', 10), 1);
  const pageSize = Math.min(Math.max(parseInt(req.query.pageSize || '50', 10), 1), 500);
  const sort = req.query.sort || '-updatedAt';
  const q = { pharmacyId: myPharmacy._id };
  const cursor = PharmacyInventory.find(q).sort(sort);
  const [items, total] = await Promise.all([
    cursor.skip((page - 1) * pageSize).limit(pageSize),
    PharmacyInventory.countDocuments(q)
  ]);
  try { inc('pharmacy_inventory_list_total'); } catch { /* noop */ }
  res.json({ success: true, data: items, page, pageSize, sort, total });
};

export const upsertInventoryItems = async (req, res) => {
  try {
    const myPharmacy = await Pharmacy.findOne({ ownerUserId: req.user._id });
    if (!myPharmacy) return res.status(404).json({ success: false, message: 'No pharmacy profile' });
    const items = Array.isArray(req.body) ? req.body : [req.body];
  const results = [];
    for (const it of items) {
      let { drugId, sku, batchNumber, expiryDate, price, unitPrice, currency, qtyOnHand, reorderLevel, visibility } = it || {};
      const resolvedPrice = unitPrice != null ? unitPrice : price;
      if (resolvedPrice != null && Number.isNaN(Number(resolvedPrice))) return badRequest(res, [{ field: 'price', message: 'price/unitPrice must be number' }]);
      if (qtyOnHand != null && Number.isNaN(Number(qtyOnHand))) return badRequest(res, [{ field: 'qtyOnHand', message: 'qtyOnHand must be number' }]);
      // If drugId is provided but not a valid ObjectId, treat it as SKU for convenience in tests/CSV imports
      if (drugId && !mongoose.Types.ObjectId.isValid(drugId)) {
        sku = sku || String(drugId);
        drugId = undefined;
      }
      if (!drugId && !sku) return badRequest(res, [{ field: 'drugId/sku', message: 'Either drugId or sku is required' }]);
      const filter = { pharmacyId: myPharmacy._id, batchNumber: batchNumber || null };
      if (drugId) filter.drugId = drugId; else filter.sku = sku || null;
      const update = { $set: { expiryDate, unitPrice: resolvedPrice, currency, qtyOnHand, reorderLevel, visibility, sku: sku || undefined } };
      const row = await PharmacyInventory.findOneAndUpdate(filter, update, { new: true, upsert: true, setDefaultsOnInsert: true });
      results.push(row);
    }
  try { inc('pharmacy_inventory_upsert_total', results.length || 1); } catch { /* noop */ }
    res.status(201).json({ success: true, data: results });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to upsert inventory', error: error.message });
  }
};

export const createStockMovement = async (req, res) => {
  try {
    const myPharmacy = await Pharmacy.findOne({ ownerUserId: req.user._id });
    if (!myPharmacy) return res.status(404).json({ success: false, message: 'No pharmacy profile' });
  const allowed = ['Purchase','Adjustment','Dispense','Return','Loss'];
  const payload = { ...req.body, pharmacyId: myPharmacy._id, performedById: req.user._id };
  if (!allowed.includes(payload.type)) return badRequest(res, [{ field: 'type', message: `type must be one of ${allowed.join(', ')}` }]);
    const row = await PharmacyStockMovement.create(payload);
  try { inc('pharmacy_stock_movement_create_total'); } catch { /* noop */ }
  res.status(201).json({ success: true, data: row });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create stock movement', error: error.message });
  }
};

export const listMyOrders = async (req, res) => {
  try {
    const myPharmacy = await Pharmacy.findOne({ ownerUserId: req.user._id });
    if (!myPharmacy) return res.status(404).json({ success: false, message: 'No pharmacy profile' });
  const { status } = req.query;
  const page = Math.max(parseInt(req.query.page || '1', 10), 1);
  const pageSize = Math.min(Math.max(parseInt(req.query.pageSize || '50', 10), 1), 200);
  const sort = req.query.sort || '-createdAt';
  const filter = { pharmacyId: myPharmacy._id };
  if (status) filter.status = status;
  const [items, total] = await Promise.all([
    PharmacyOrder.find(filter).sort(sort).skip((page - 1) * pageSize).limit(pageSize),
    PharmacyOrder.countDocuments(filter)
  ]);
  res.json({ success: true, data: items, page, pageSize, sort, status: status || null, total });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to list orders', error: error.message });
  }
};

const TERMINAL_STATUSES = new Set(['Dispensed','Rejected','Canceled']);
const ORDER_FLOW = {
  New: ['Accepted','Rejected','Canceled'],
  Accepted: ['ReadyForPickup','Dispensed','Rejected','Canceled'],
  ReadyForPickup: ['Dispensed','Rejected','Canceled'],
  OutForDelivery: ['Dispensed','Rejected','Canceled']
};

async function transitionOrder(req, res, nextStatus) {
  const myPharmacy = await Pharmacy.findOne({ ownerUserId: req.user._id });
  if (!myPharmacy) return res.status(404).json({ success: false, message: 'No pharmacy profile' });
  const { id } = req.params;
  const row = await PharmacyOrder.findOne({ _id: id, pharmacyId: myPharmacy._id });
  if (!row) return res.status(404).json({ success: false, message: 'Order not found' });
  if (TERMINAL_STATUSES.has(row.status)) return res.status(409).json({ success: false, message: `Order is in terminal state ${row.status}` });
  const allowed = ORDER_FLOW[row.status] || [];
  if (!allowed.includes(nextStatus)) return res.status(400).json({ success: false, message: `Cannot transition from ${row.status} to ${nextStatus}` });
  const before = row.toObject();

  if (nextStatus === 'Dispensed') {
    const { inventoryId, qty } = req.body || {};
    const qtyNum = Number(qty);
    if (!inventoryId || !qtyNum || Number.isNaN(qtyNum) || qtyNum <= 0) {
      return badRequest(res, [{ field: 'inventoryId/qty', message: 'inventoryId and positive qty are required for dispense' }]);
    }
    const inv = await PharmacyInventory.findOne({ _id: inventoryId, pharmacyId: myPharmacy._id });
    if (!inv) return res.status(404).json({ success: false, message: 'Inventory item not found for this pharmacy' });
    if (inv.qtyOnHand < qtyNum) {
  try { const { inc } = await import('../services/metrics.service.js'); inc('stockouts_total'); } catch { /* noop */ }
      return res.status(400).json({ success: false, message: 'Insufficient stock to dispense' });
    }
    inv.qtyOnHand -= qtyNum;
    await inv.save();
    await PharmacyStockMovement.create({ pharmacyId: myPharmacy._id, inventoryId: inv._id, type: 'Dispense', qty: qtyNum, reason: 'Order Dispensed', referenceType: 'Prescription', referenceId: row.prescriptionId, performedById: req.user._id });
  }
  row.status = nextStatus;
  await row.save();
  // Notify patient on key transitions
  const map = {
    Accepted: 'PharmacyOrderAccepted',
    ReadyForPickup: 'PharmacyOrderReady',
    Dispensed: 'PharmacyOrderDispensed',
    Rejected: 'PharmacyOrderRejected'
  };
  const eventType = map[nextStatus] || 'PharmacyOrderUpdated';
  const content = `Your prescription order ${String(row._id)} status is now ${nextStatus}.`;
  if (row.patientId) await NotificationService.dispatchEvent(eventType, content, row.patientId);

  // Notify ordering doctor, record lifecycle on dispense
  let rxDoctorId = null;
  try {
    const rx = await Prescription.findById(row.prescriptionId).select('doctor lifecycleId');
    rxDoctorId = rx?.doctor || null;
    if (rx?.lifecycleId && nextStatus === 'Dispensed') {
      const AppointmentLifecycleEvent = (await import('../modules/appointments/appointment-lifecycle-event.model.js')).default;
      try { await AppointmentLifecycleEvent.create({ lifecycleId: rx.lifecycleId, eventType: 'RxDispensed', actorId: req.user._id, payload: { orderId: row._id.toString() } }); } catch { /* noop */ }
    }
  } catch { /* noop */ }
  if (rxDoctorId) await NotificationService.dispatchEvent(eventType, `Patient order ${String(row._id)} is now ${nextStatus}.`, rxDoctorId);

  // socket broadcast
  try {
    const io = getIO();
    if (row.patientId) io.to(`user_${row.patientId}`).emit('order_status_updated', { orderId: row._id.toString(), status: row.status, type: 'pharmacy' });
    if (rxDoctorId) io.to(`user_${rxDoctorId}`).emit('order_status_updated', { orderId: row._id.toString(), status: row.status, type: 'pharmacy' });
  } catch { /* noop */ }

  // open message thread on accept
  if (nextStatus === 'Accepted' && row.patientId) {
    try {
      const msg = new ChatMessage({ sender: req.user._id, receiver: row.patientId, content: 'Your order has been accepted. We will update you when it is ready.', targetType: 'PharmacyOrder', targetId: row._id });
      await msg.save();
      try { const io = getIO(); io.to(`user_${row.patientId}`).emit('new_message', { id: msg._id.toString(), targetType: 'PharmacyOrder', targetId: row._id.toString() }); } catch { /* noop */ }
    } catch { /* noop */ }
  }

  // metrics
  if (nextStatus === 'Dispensed') { try { const { inc } = await import('../services/metrics.service.js'); inc('dispensed_total'); } catch { /* noop */ } }

  // audit
  try { await AuditService.log(req.user._id, req.user.role, 'order_status_change', 'pharmacy_order', row._id, { to: nextStatus }, { before, after: row.toObject() }, req); } catch { /* noop */ }

  try { inc(`pharmacy_order_transition_${nextStatus.toLowerCase()}_total`); } catch { /* noop */ }
  res.json({ success: true, data: row });
}

export const acceptOrder = (req, res) => transitionOrder(req, res, 'Accepted');
export const markOrderReady = (req, res) => transitionOrder(req, res, 'ReadyForPickup');
export const dispenseOrder = (req, res) => transitionOrder(req, res, 'Dispensed');
export const rejectOrder = (req, res) => transitionOrder(req, res, 'Rejected');
