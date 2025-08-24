import express from 'express';
import { login, register, getCurrentUser, logout } from '../modules/auth/auth.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/login', login);
router.post('/register', register);
// Logout route to record audit and notifications
router.post('/logout', authenticate, logout);
// Protected route to get current authenticated user
router.get('/me', authenticate, getCurrentUser);

export default router;
