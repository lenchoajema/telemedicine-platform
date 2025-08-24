import express from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { checkRole } from '../middleware/authorization.middleware.js';
import Prescription from '../modules/patients/prescriptions.model.js';
import PharmacyOrder from '../modules/erx/pharmacy-order.model.js';
import NotificationService from '../services/NotificationService.js';
import { getIO } from '../services/socket.service.js';
import { inc } from '../services/metrics.service.js';
import AppointmentLifecycleEvent from '../modules/appointments/appointment-lifecycle-event.model.js';

const router = express.Router();

router.use(authenticate);

// POST /api/prescriptions/:id/route-to-pharmacy
router.post('/:id/route-to-pharmacy', checkRole(['doctor','patient','admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { pharmacyId, fulfillmentType, notes } = req.body;
    const rx = await Prescription.findByIdAndUpdate(id, { pharmacyId }, { new: true });
    if (!rx) return res.status(404).json({ success: false, message: 'Prescription not found' });
  const order = await PharmacyOrder.create({ prescriptionId: rx._id, pharmacyId, patientId: rx.patient, status: 'New', fulfillmentType: fulfillmentType || 'Pickup', notes });
  try { inc('pharmacy_orders_created_total'); } catch { /* noop */ }
  try { await NotificationService.dispatchEvent('PharmacyOrderCreated', `A new prescription order ${String(order._id)} has been created.`, rx.patient); } catch { /* noop */ }
  try { const io = getIO(); io.to(`user_${rx.patient}`).emit('order_new', { orderId: order._id.toString(), type: 'pharmacy' }); } catch { /* noop */ }
  try { if (rx.lifecycleId) await AppointmentLifecycleEvent.create({ lifecycleId: rx.lifecycleId, eventType: 'RxRouted', actorId: req.user._id, payload: { orderId: order._id.toString(), pharmacyId: String(pharmacyId) } }); } catch { /* noop */ }
  res.status(201).json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to route prescription', error: error.message });
  }
});

// PATCH /api/prescriptions/:id/cancel-routing
router.patch('/:id/cancel-routing', checkRole(['doctor','patient','admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const rx = await Prescription.findById(id);
    if (!rx) return res.status(404).json({ success: false, message: 'Prescription not found' });
    await PharmacyOrder.updateMany({ prescriptionId: rx._id, status: { $in: ['New','Accepted','ReadyForPickup'] } }, { status: 'Canceled' });
    rx.pharmacyId = null;
    await rx.save();
    res.json({ success: true, data: rx });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to cancel routing', error: error.message });
  }
});

export default router;
