import express from 'express';
import { authenticate } from '../../middleware/auth.middleware.js';
import { createSession, getSessions, getMessages, postMessage, fetchMessages, sendGeneralMessage, markMessageRead, getSupportSession, getContacts } from './chat.controller.js';
import { verifyChatConsent } from './consent.middleware.js';

const router = express.Router();

// All chat endpoints require authentication
// Require authentication for all chat endpoints
router.use(authenticate);
// Expose contacts without requiring chat consent
router.get('/contacts', getContacts);
// List chat sessions for a user
router.get('/sessions', getSessions);
// Create or join a chat session
router.post('/sessions', createSession);
// Get or create support session
router.get('/support-session', authenticate, getSupportSession);
// Messaging operations now require chat consent

// General message history endpoint
router.get('/messages', verifyChatConsent, fetchMessages);

// Get messages for a session
router.get('/sessions/:sessionId/messages', verifyChatConsent, getMessages);

// Send a message in a session
router.post('/sessions/:sessionId/messages', verifyChatConsent, postMessage);
// Send a general message
router.post('/messages', verifyChatConsent, sendGeneralMessage);
// Mark a message as read
router.patch('/messages/:messageId/read', verifyChatConsent, markMessageRead);

export default router;
