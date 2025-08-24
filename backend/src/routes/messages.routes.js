import express from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { verifyChatConsent } from '../modules/chats/consent.middleware.js';
import { fetchMessages, sendGeneralMessage } from '../modules/chats/chat.controller.js';

const router = express.Router();

router.use(authenticate);

router.get('/messages', verifyChatConsent, fetchMessages);
router.post('/messages', verifyChatConsent, sendGeneralMessage);

export default router;
 