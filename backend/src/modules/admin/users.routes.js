import express from 'express';
import { getAllUsers, getUserById, updateUserStatus } from './users.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { authorizeAdmin } from '../../middleware/authorization.middleware.js';

const router = express.Router();

// Apply authentication middleware
router.use(authenticate);

// Apply admin authorization middleware
router.use(authorizeAdmin);

// Get all users (with filtering)
router.get('/', getAllUsers);

// Get specific user by ID
router.get('/:userId', getUserById);

// Update user status
router.put('/:userId/status', updateUserStatus);

export default router;
