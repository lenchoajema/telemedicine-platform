import express from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import {
  initAppointmentLifecycle,
  getAppointmentLifecycle,
  addLifecycleEvent,
  updateLifecycleStatus
} from '../modules/appointments/appointment-lifecycle.controller.js';

const router = express.Router({ mergeParams: true });

// Protect all lifecycle routes
router.use(authenticate);

// Initialize lifecycle for an appointment
router.post('/', initAppointmentLifecycle);

// Get the full lifecycle and its events
router.get('/', getAppointmentLifecycle);

// Log a new event in the lifecycle
router.post('/events', addLifecycleEvent);

// Update lifecycle status or closure notes
router.patch('/status', updateLifecycleStatus);

// Convenience alias for setting UnderReview (triage)
// PATCH /api/appointments/:appointmentId/lifecycle/status { currentStatus: 'UnderReview' }
// Already covered by /status; UI can call with desired status per workflow.

export default router;
