// backend/src/middleware/rbac.middleware.js
import Role from '../modules/admin/role.model.js';
import { PRIVILEGES } from '../modules/admin/privileges.config.js';

// Attach privileges array to req.user based on their role
export const attachUserPrivileges = async (req, res, next) => {
  if (req.user) {
    if (req.user.role === 'admin') {
      req.user.privileges = PRIVILEGES;
    } else {
      const role = await Role.findOne({ name: req.user.role });
      req.user.privileges = (role && role.privileges) || [];
    }
  }
  next();
};

// Middleware factory to authorize based on a required privilege
export const authorizePrivilege = (privilege) => (req, res, next) => {
  const privileges = (req.user && Array.isArray(req.user.privileges)) ? req.user.privileges : [];
  if (req.user && (req.user.role === 'admin' || privileges.includes(privilege))) {
    return next();
  }
  const url = req.originalUrl || '';
  const isSignNote = url.includes('/notes') && url.includes('/sign');
  const response = {
    success: false,
    message: 'Insufficient privileges',
    detail: `You need the '${privilege}' privilege to perform this action.`,
    suggestion: isSignNote
      ? "To sign a consultation note, ask an admin to grant you the 'Create/Edit Consultation Notes' privilege or use a doctor/admin account."
      : 'Ask an admin to grant this privilege to your role or use an account with the correct role.',
  };
  res.status(403).json(response);
};
