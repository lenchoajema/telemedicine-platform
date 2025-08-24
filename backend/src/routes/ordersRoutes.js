import express from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { checkRole } from '../middleware/authorization.middleware.js';
import { createLabOrders, createImagingOrder, updateLabStatus, updateImagingStatus, postLabResults, postImagingReport, listLabOrders, listImagingOrders } from '../modules/orders/orders.controller.js';
import PharmacyOrder from '../modules/erx/pharmacy-order.model.js';
import Prescription from '../modules/patients/prescriptions.model.js';
import AppointmentLifecycleEvent from '../modules/appointments/appointment-lifecycle-event.model.js';
import LabExamination from '../modules/patients/lab-examination.model.js';

const router = express.Router();

router.use(authenticate);

// List orders
router.get('/labs', checkRole(['doctor','lab','laboratory','admin']), listLabOrders);
router.get('/imaging', checkRole(['doctor','radiology','admin']), listImagingOrders);

router.post('/labs', checkRole(['doctor']), createLabOrders);
router.post('/imaging', checkRole(['doctor']), createImagingOrder);
router.patch('/labs/:labExamId/status', checkRole(['lab','laboratory','doctor']), updateLabStatus);
router.patch('/imaging/:imagingId/status', checkRole(['radiology','doctor']), updateImagingStatus);
router.post('/labs/:labExamId/results', checkRole(['lab','laboratory']), postLabResults);
router.post('/imaging/:imagingId/report', checkRole(['radiology']), postImagingReport);

// Patient routes lab order to a Laboratory
router.patch('/labs/:labExamId/route', checkRole(['patient','doctor','admin']), async (req, res) => {
	try {
		const { labExamId } = req.params;
		const { labId, lifecycleId } = req.body || {};
		const row = await LabExamination.findByIdAndUpdate(labExamId, { labId }, { new: true });
		if (!row) return res.status(404).json({ success: false, message: 'Lab exam not found' });
		if (lifecycleId) {
			try { await AppointmentLifecycleEvent.create({ lifecycleId, eventType: 'OrderRouted', actorId: req.user._id, payload: { labExamId, labId } }); } catch { /* noop */ }
		}
		res.json({ success: true, data: row });
	} catch (error) {
		res.status(500).json({ success: false, message: 'Failed to route lab order', error: error.message });
	}
});

// Route a prescription to a pharmacy (doctor/patient)
router.post('/prescriptions/:id/route-to-pharmacy', checkRole(['doctor','patient','admin']), async (req, res) => {
	try {
		const { id } = req.params;
		const { pharmacyId, fulfillmentType, notes } = req.body;
		const rx = await Prescription.findByIdAndUpdate(id, { pharmacyId }, { new: true });
		if (!rx) return res.status(404).json({ success: false, message: 'Prescription not found' });
		const order = await PharmacyOrder.create({ prescriptionId: rx._id, pharmacyId, patientId: rx.patient, status: 'New', fulfillmentType: fulfillmentType || 'Pickup', notes });
		res.status(201).json({ success: true, data: order });
	} catch (error) {
		res.status(500).json({ success: false, message: 'Failed to route prescription', error: error.message });
	}
});

// Cancel routing (doctor/patient)
router.patch('/prescriptions/:id/cancel-routing', checkRole(['doctor','patient','admin']), async (req, res) => {
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
