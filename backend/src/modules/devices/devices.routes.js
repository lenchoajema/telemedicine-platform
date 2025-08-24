import express from 'express';
import { connectDevice, getStatus, syncData, getVitals, disconnectDevice } from './devices.controller.js';

const router = express.Router();

// For a real implementation, these routes would be protected and require user authentication
router.post('/connect', connectDevice); // Placeholder for OAuth initiation
router.get('/status', getStatus);
router.post('/sync', syncData); // Placeholder for manual sync trigger
router.get('/vitals', getVitals);
router.delete('/disconnect', disconnectDevice);
// Also support RESTful style: DELETE /api/devices/:integrationId
router.delete('/:integrationId', disconnectDevice);

export default router;
