import express from 'express';
import { 
  createVideoCallRoom, 
  endVideoCallSession, 
  getVideoCallSession,
  testVideoCallConnection 
} from './video-call.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticate);

// Create video call room for appointment
router.post('/appointment/:appointmentId/room', createVideoCallRoom);

// Get video call session details
router.get('/appointment/:appointmentId/session', getVideoCallSession);

// End video call session
router.post('/appointment/:appointmentId/end', endVideoCallSession);

// Test video call connection
router.get('/connection-test', testVideoCallConnection);

export default router;
