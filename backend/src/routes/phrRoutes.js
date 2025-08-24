import express from 'express';
import { getOverview, createShareLink, listShareLinks, revokeShareLink, externalShareAccess, listConsultations, listPrescriptions, listDocuments, listLabs, listImaging, getPreferences, updatePreferences, listAccessLogs, createExportJob, getExportJob } from '../modules/phr/phr.controller.js';
import { requireFlag } from '../middleware/featureFlags.js';
import { rateLimit } from '../middleware/rateLimit.js';

const router = express.Router();

router.get('/overview', requireFlag('phrEnabled'), getOverview);
router.post('/share-links', requireFlag('phrShareLinks'), rateLimit({ bucket:'shareLinks:create', windowMs:3600000, max:5 }), createShareLink);
router.get('/share-links', requireFlag('phrShareLinks'), listShareLinks);
router.patch('/share-links/:id/revoke', requireFlag('phrShareLinks'), revokeShareLink);
router.get('/share/:token', externalShareAccess);
router.get('/consultations', requireFlag('phrEnabled'), listConsultations);
router.get('/prescriptions', requireFlag('phrEnabled'), listPrescriptions);
router.get('/documents', requireFlag('phrEnabled'), listDocuments);
router.get('/labs', requireFlag('phrEnabled'), listLabs);
router.get('/imaging', requireFlag('phrEnabled'), listImaging);
router.get('/settings', requireFlag('phrEnabled'), getPreferences);
router.put('/settings', requireFlag('phrEnabled'), updatePreferences);
router.get('/audit', requireFlag('phrEnabled'), listAccessLogs);
router.post('/export/jobs', requireFlag('phrEnabled'), rateLimit({ bucket:'export:create', windowMs:3600000, max:3 }), createExportJob);
router.get('/export/jobs/:jobId', requireFlag('phrEnabled'), getExportJob);

export default router;
