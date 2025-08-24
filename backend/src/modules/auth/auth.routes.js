import express from 'express';
import { register, login, getCurrentUser, registrationOptions } from './auth.controller.js';
import authMiddleware from '../shared/middleware/auth.js';

const router = express.Router();

router.post('/register', register);
router.get('/register/options', registrationOptions);
router.post('/login', login);
router.get('/me', authMiddleware, getCurrentUser);

export default router;
