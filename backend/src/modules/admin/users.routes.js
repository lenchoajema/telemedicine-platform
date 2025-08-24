import express from 'express';
import { 
  getAllUsers, 
  getUserById, 
  updateUserStatus,
  createUser,
  deleteUser,
  resetUserPassword,
  bulkUserActions,
  getUserStats,
  updateUserProfile,
  exportUsersCsv,
  importUsersCsv
} from './users.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { authorizeAdmin, authorizeSuperAdmin } from '../../middleware/authorization.middleware.js';

const router = express.Router();

// Apply authentication middleware
router.use(authenticate);

// Apply admin authorization middleware
router.use(authorizeAdmin);

// Get user statistics
router.get('/stats', getUserStats);

// Get all users (with filtering)
router.get('/', getAllUsers);

// Create new user
router.post('/', createUser);

// Bulk user actions
router.post('/bulk', bulkUserActions);

// Export users CSV
router.get('/export/csv', exportUsersCsv);

// Import users CSV (expects { csv, dryRun })
router.post('/import/csv', importUsersCsv);

// Get specific user by ID
router.get('/:userId', getUserById);

// Update user profile
router.put('/:userId', updateUserProfile);

// Super Admin: edit/update any user (explicit route)
router.patch('/super/:userId', authorizeSuperAdmin, updateUserProfile);

// Update user status
router.put('/:userId/status', updateUserStatus);

// Reset user password
router.post('/:userId/reset-password', resetUserPassword);

// Delete user
router.delete('/:userId', deleteUser);

export default router;
