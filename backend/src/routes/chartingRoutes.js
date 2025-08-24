import express from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorizePrivilege } from '../middleware/rbac.middleware.js';
import { getChart, upsertNote, updateNote, signNote, listTemplates, upsertTemplate, batchInsertObservations } from '../modules/charting/charting.controller.js';

const router = express.Router({ mergeParams: true });

router.use(authenticate);

// Chart
router.get('/', getChart);
router.post('/notes', authorizePrivilege('Create/Edit Consultation Notes'), upsertNote);

// Notes
router.patch('/notes/:noteId', authorizePrivilege('Create/Edit Consultation Notes'), updateNote);
router.post('/notes/:noteId/sign', authorizePrivilege('Create/Edit Consultation Notes'), signNote);

// Templates
router.get('/note-templates', listTemplates);
router.post('/note-templates', authorizePrivilege('Create/Edit Consultation Notes'), upsertTemplate);

export default router;

// Separate router for global observations
export const observationsRouter = express.Router();
observationsRouter.use(authenticate);
observationsRouter.post('/', batchInsertObservations);
