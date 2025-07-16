import express from 'express';
import {
  getAvailableSlots,
  reserveSlot,
  getSlotHistory,
  generateSlots,
  cleanExpiredReservations
} from '../controllers/timeSlotController.js';

const router = express.Router();

// Get available slots for a doctor on a specific date
router.get('/available', getAvailableSlots);

// Reserve a slot temporarily (remove auth for now)
router.post('/reserve/:slotId', reserveSlot);

// Admin routes (remove auth for now)
router.get('/history', getSlotHistory);
router.post('/generate', generateSlots);
router.post('/clean-expired', cleanExpiredReservations);

export default router;
