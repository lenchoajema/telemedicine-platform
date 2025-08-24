import express from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import EligibilityCheck from '../models/EligibilityCheck.js';
import Claim from '../models/Claim.js';
import AuditService from '../services/AuditService.js';

const router = express.Router();
router.use(authenticate);

// POST /api/insurance/eligibility
router.post('/eligibility', async (req, res) => {
  try {
    const { patientId, payerId, policyNumber, services = [] } = req.body || {};
    const check = await EligibilityCheck.create({ patientId: patientId || req.user._id, payerId, policyNumber, serviceCodes: services, outcome: 'Unknown' });
    await AuditService.log(req.user._id, req.user.role, 'eligibility_check_created', 'eligibility_check', check._id, { payerId }, null, req);
    res.status(201).json({ check });
  } catch (e) { console.log('POST /api/insurance/eligibility error', e); res.status(500).json({ error: 'Failed to create eligibility check' }); }
});

// POST /api/insurance/claims
router.post('/claims', async (req, res) => {
  try {
    const { appointmentId, payerId, policyNumber } = req.body || {};
    const claim = await Claim.create({ appointmentId, patientId: req.user._id, payerId, policyNumber, status: 'Prepared', lineItems: [] });
    await AuditService.log(req.user._id, req.user.role, 'claim_created', 'claim', claim._id, { appointmentId }, null, req);
    res.status(201).json({ claim });
  } catch (e) { console.log('POST /api/insurance/claims error', e); res.status(500).json({ error: 'Failed to create claim' }); }
});

router.get('/claims/:id', async (req, res) => {
  try {
    const claim = await Claim.findOne({ _id: req.params.id, patientId: req.user._id });
    if (!claim) return res.status(404).json({ error: 'Claim not found' });
    res.json({ claim });
  } catch (e) { console.log('GET /api/insurance/claims/:id error', e); res.status(500).json({ error: 'Failed to load claim' }); }
});

export default router;
