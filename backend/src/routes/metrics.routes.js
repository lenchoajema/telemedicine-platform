import express from 'express';
import { authorizeAdmin } from '../middleware/authorization.middleware.js';
import { snapshot } from '../services/metrics.service.js';

const router = express.Router();

// GET /api/admin/metrics - Admin-only metrics snapshot
router.get('/', authorizeAdmin, (_req, res) => {
  try {
    const data = snapshot();
    return res.json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to get metrics', error: err?.message });
  }
});

export default router;
