import express from 'express';
import { authenticate } from '../../middleware/auth.middleware.js';
import { attachUserPrivileges } from '../../middleware/rbac.middleware.js';
import { getTemplate, previewTemplate, publishTemplate, listExceptions, createException, deleteException } from './availability.controller.js';
import Doctor from '../doctors/doctor.model.js';
import AppointmentSlot from '../appointment-slots/appointment-slot.model.js';

const router = express.Router({ mergeParams: true });
router.use(authenticate, attachUserPrivileges);

// Role guard: doctor/admin for authoring endpoints, but allow any authenticated user (e.g. patient) to read slots.
router.use('/:doctorId', async (req, res, next) => {
	if (!req.user) return res.status(401).json({ success:false, message:'Auth required'});
	// Allow all authenticated roles to access the slots listing for booking.
	if (req.path === '/slots') return next();
	// Admin always allowed.
	if (req.user.role === 'admin') return next();
	if (req.user.role === 'doctor') {
		const paramId = String(req.params.doctorId);
		const userId = String(req.user._id || req.user.id);
		if (paramId === userId) return next();
		// Fallback: param might be Doctor profile _id; verify it maps to this user.
			if (paramId.length === 24) {
				try {
					const doc = await Doctor.findById(paramId).select('user');
					if (doc && String(doc.user) === userId) return next();
				} catch { /* ignore lookup errors */ }
			}
	}
	return res.status(403).json({ success:false, message:'Forbidden: doctor/admin only' });
});

router.get('/:doctorId/availability/template', getTemplate);
router.post('/:doctorId/availability/preview', previewTemplate);
router.post('/:doctorId/availability/publish', publishTemplate);
router.get('/:doctorId/availability/exceptions', listExceptions);
router.post('/:doctorId/availability/exceptions', createException);
router.delete('/:doctorId/availability/exceptions/:exceptionId', deleteException);

// Public (authenticated) slots query exposing slotHash for booking integrity
router.get('/:doctorId/slots', async (req, res) => {
	try {
		const { from, to } = req.query;
		if (!from || !to) return res.status(400).json({ success:false, message:'from & to required (YYYY-MM-DD)' });
		const start = new Date(from); const end = new Date(to);
		let doctorRef = req.params.doctorId;
		// Attempt to resolve if a user id was passed instead of Doctor doc id (common legacy/fallback path)
		if (doctorRef && doctorRef.length === 24) {
			// Check if this is already a Doctor document id; if not, try treating it as a user id.
			const doc = await Doctor.findById(doctorRef).select('_id');
			if (!doc) {
				const byUser = await Doctor.findOne({ user: doctorRef }).select('_id');
				if (byUser) doctorRef = byUser._id.toString();
			}
		}
		const slots = await AppointmentSlot.find({ doctor: doctorRef, date: { $gte: start, $lte: end }, isAvailable: true })
			.sort({ date:1, startTime:1 });
		res.json({ success:true, doctorId: doctorRef, data: slots.map(s => ({ id: s._id, date: s.date, startTime: s.startTime, endTime: s.endTime, slotHash: s.slotHash })) });
	} catch (e) { res.status(500).json({ success:false, message:'Failed to fetch slots', error: e.message }); }
});

export default router;
