// CommonJS wrapper for RBAC middleware (for testing compatibility)
const RoleModule = require('../modules/admin/role.model.js');
const Role = RoleModule.default || RoleModule;
const { PRIVILEGES } = require('../modules/admin/privileges.config.js');

async function attachUserPrivileges(req, res, next) {
  if (req.user) {
    if (req.user.role === 'admin') {
      req.user.privileges = PRIVILEGES;
    } else {
      const role = await Role.findOne({ name: req.user.role });
      req.user.privileges = (role && role.privileges) || [];
    }
  }
  next();
}

function authorizePrivilege(privilege) {
  return (req, res, next) => {
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
}

module.exports = { attachUserPrivileges, authorizePrivilege };
