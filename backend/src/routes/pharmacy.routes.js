import express from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { checkRole } from '../middleware/authorization.middleware.js';
import {
  registerPharmacy,
  getMyPharmacy,
  updateMyPharmacy,
  listMyInventory,
  upsertInventoryItems,
  createStockMovement,
  // list endpoint will be defined inline below using model to avoid circular import
  listMyOrders,
  acceptOrder,
  markOrderReady,
  dispenseOrder,
  rejectOrder,
} from '../services/pharmacy.portal.controller.js';

const router = express.Router();

router.use(authenticate);
router.use(checkRole(['pharmacist','admin']));

router.post('/register', registerPharmacy);
router.get('/me', getMyPharmacy);
router.put('/me', updateMyPharmacy);

router.get('/inventory', listMyInventory);
router.post('/inventory', upsertInventoryItems);
router.post('/stock-movements', createStockMovement);
// Minimal stock movements list for verification and UI history
router.get('/stock-movements', async (req, res) => {
  try {
    const { default: Pharmacy } = await import('../modules/erx/pharmacy.model.js');
    const { default: PharmacyStockMovement } = await import('../modules/erx/pharmacy-stock-movement.model.js');
    const myPharmacy = await Pharmacy.findOne({ ownerUserId: req.user._id });
    if (!myPharmacy) return res.status(404).json({ success: false, message: 'No pharmacy profile' });
    const page = Math.max(parseInt(req.query.page || '1', 10), 1);
    const pageSize = Math.min(Math.max(parseInt(req.query.pageSize || '50', 10), 1), 200);
    const sort = req.query.sort || '-createdAt';
    const q = { pharmacyId: myPharmacy._id };
    const [items, total] = await Promise.all([
      PharmacyStockMovement.find(q).sort(sort).skip((page-1)*pageSize).limit(pageSize),
      PharmacyStockMovement.countDocuments(q)
    ]);
    res.json({ success: true, data: items, page, pageSize, sort, total });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to list stock movements', error: error.message });
  }
});

router.get('/orders', listMyOrders);
router.patch('/orders/:id/accept', acceptOrder);
router.patch('/orders/:id/ready', markOrderReady);
router.patch('/orders/:id/dispense', dispenseOrder);
router.patch('/orders/:id/reject', rejectOrder);

export default router;
