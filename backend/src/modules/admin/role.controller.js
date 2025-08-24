import Role from './role.model.js';
import { PRIVILEGES } from './privileges.config.js';

// GET /api/admin/roles
export const getRoles = async (req, res) => {
  try {
    const roles = await Role.find().sort('name');
    res.status(200).json({ success: true, data: roles });
  } catch (err) {
    console.log('Error fetching roles:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch roles' });
  }
};

// GET /api/admin/roles/:id
export const getRoleById = async (req, res) => {
  try {
    const role = await Role.findById(req.params.id);
    if (!role) {
      return res.status(404).json({ success: false, message: 'Role not found' });
    }
    res.status(200).json({ success: true, data: role });
  } catch (err) {
    console.log('Error fetching role:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch role' });
  }
};

// POST /api/admin/roles
export const createRole = async (req, res) => {
  try {
    const { name, description, privileges, isActive } = req.body;
    const existing = await Role.findOne({ name });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Role already exists' });
    }
    const role = await Role.create({ name, description, privileges, isActive });
    res.status(201).json({ success: true, data: role });
  } catch (err) {
    console.log('Error creating role:', err);
    res.status(500).json({ success: false, message: 'Failed to create role' });
  }
};

// PUT /api/admin/roles/:id
export const updateRole = async (req, res) => {
  try {
    const updates = req.body;
    const role = await Role.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    if (!role) {
      return res.status(404).json({ success: false, message: 'Role not found' });
    }
    res.status(200).json({ success: true, data: role });
  } catch (err) {
    console.log('Error updating role:', err);
    res.status(500).json({ success: false, message: 'Failed to update role' });
  }
};

// PATCH /api/admin/roles/:id/disable
export const toggleRoleActive = async (req, res) => {
  try {
    const role = await Role.findById(req.params.id);
    if (!role) {
      return res.status(404).json({ success: false, message: 'Role not found' });
    }
    role.isActive = !role.isActive;
    await role.save();
    res.status(200).json({ success: true, data: role });
  } catch (err) {
    console.log('Error toggling role status:', err);
    res.status(500).json({ success: false, message: 'Failed to update role status' });
  }
};

// GET /api/admin/roles/privileges
export const getPrivileges = (req, res) => {
  res.status(200).json({ success: true, data: PRIVILEGES });
};
