import express from 'express';
import {
  getRoles,
  getRoleById,
  createRole,
  updateRole,
  toggleRoleActive,
  getPrivileges,
} from '../modules/admin/role.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { attachUserPrivileges } from '../middleware/rbac.middleware.js';
import { authorizeAdmin } from '../middleware/authorization.middleware.js';

const router = express.Router();

// Apply authentication, attach privileges, and admin authorization
router.use(authenticate);
router.use(attachUserPrivileges);
router.use(authorizeAdmin);

// Role management endpoints
router.get('/', getRoles);
// Fetch list of all available privileges
router.get('/privileges', getPrivileges);
// Get specific role by ID
router.get('/:id', getRoleById);
router.post('/', createRole);
router.put('/:id', updateRole);
router.patch('/:id/disable', toggleRoleActive);

export default router;
