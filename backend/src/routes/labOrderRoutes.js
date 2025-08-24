import express from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { checkRole } from '../middleware/authorization.middleware.js';
import {
  createLabOrder,
  getLabOrders,
  getLabOrderById,
  updateLabOrder
} from '../modules/labOrders/lab-order.controller.js';

const router = express.Router();

// Protect all lab order routes
router.use(authenticate);

// Get all lab orders (doctor: own, patient: own record orders, admin/lab: all)
router.get('/', getLabOrders);

// Create a new lab order (doctors only)
router.post('/', checkRole(['doctor']), createLabOrder);

// Get single lab order by ID
router.get('/:id', getLabOrderById);

// Update lab order status (lab role only)
router.put('/:id', checkRole(['lab']), updateLabOrder);

export default router;
