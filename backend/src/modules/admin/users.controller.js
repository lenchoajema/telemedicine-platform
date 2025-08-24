// Clean replacement implementation
import User from '../../models/User.js';
import Doctor from '../doctors/doctor.model.js';
import DoctorAvailability from '../doctors/availability.model.js';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import mongoose from 'mongoose';
import AuditService from '../../services/AuditService.js';

// Helpers
const normalizeStatusToModel = (s) => {
  if (!s) return undefined;
  const map = { active: 'Active', inactive: 'Deactivated', suspended: 'Suspended' };
  const v = String(s).toLowerCase();
  return map[v];
};
const normalizeStatusFromModel = (s) => {
  const map = { Active: 'active', Deactivated: 'inactive', Suspended: 'suspended' };
  return map[s] || s;
};
const ensureUsername = (email, firstName, lastName) => {
  const base = (firstName?.toLowerCase() || '') + (lastName ? `.${lastName.toLowerCase()}` : '');
  const local = email?.split('@')[0] || 'user';
  return (base || local).replace(/[^a-z0-9._-]/g, '');
};
const isSuperAdmin = (user) => {
  if (!user) return false;
  const rootEmail = process.env.ROOT_ADMIN_EMAIL || 'admin@telemedicine.com';
  return String(user.email).toLowerCase() === String(rootEmail).toLowerCase();
};

// Get all users (with optional filtering)
export const getAllUsers = async (req, res) => {
  try {
    // Filters: role, status, search; support both page/limit and cursor-based pagination
    const { role, status, search, cursor } = req.query;

    const query = {};
    if (role && ['admin', 'doctor', 'patient', 'pharmacist', 'laboratory'].includes(role)) {
      query.role = role;
    }
    if (status && ['active', 'inactive', 'suspended'].includes(String(status).toLowerCase())) {
      query.status = normalizeStatusToModel(status);
    }
    if (search) {
      const re = new RegExp(search, 'i');
      query.$or = [
        { 'profile.firstName': re },
        { 'profile.lastName': re },
        { email: re },
        { username: re }
      ];
    }
    if (cursor) {
      try {
        query._id = { $lt: new mongoose.Types.ObjectId(String(cursor)) };
      } catch {
        return res.status(400).json({ error: 'Invalid cursor' });
      }
    }

    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit || '20')));
    const items = await User.find(query)
      .select('_id email username profile role status createdAt lastLoginAt')
      .sort({ _id: -1 })
      .limit(limit + 1);

    const slice = items.slice(0, limit);
    // doctor verification status augmentation
    const augmented = await Promise.all(slice.map(async (u) => {
      const obj = u.toObject();
      if (u.role === 'doctor') {
        const doctor = await Doctor.findOne({ user: u._id }).select('verificationStatus');
        obj.verificationStatus = doctor ? doctor.verificationStatus : 'pending';
      }
      // map status down to old enum for clients that expect it
      const legacy = normalizeStatusFromModel(obj.status);
      obj.statusLegacy = legacy;
      obj.status = legacy;
      return obj;
    }));
    const nextCursor = items.length > limit ? String(slice[slice.length - 1]._id) : null;

    res.status(200).json({ users: augmented, nextCursor });
  } catch (error) {
    console.log('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

// Get user by ID
export const getUserById = async (req, res) => {
  try {
    const userId = req.params.userId;
    
    const user = await User.findById(userId)
      .select('-password');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // If user is a doctor, get additional doctor details
    let userData = user.toObject();
    if (user.role === 'doctor') {
      const doctor = await Doctor.findOne({ user: userId });
      if (doctor) userData.doctorDetails = doctor;
    }
    return res.status(200).json(userData);
  } catch (error) {
    console.log('Error fetching user:', error);
    return res.status(500).json({ error: 'Failed to fetch user' });
  }
};

// Update user status (activate, deactivate, suspend)
export const updateUserStatus = async (req, res) => {
  try {
    const mapped = normalizeStatusToModel(req.body.status);
    if (!mapped) return res.status(400).json({ error: 'Invalid status value' });
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.role === 'admin' && !isSuperAdmin(req.user)) return res.status(403).json({ error: 'Cannot modify admin user status' });
    const before = user.toObject();
    user.status = mapped;
    await user.save();
    // If doctor, reflect status to their availability (activate => available; otherwise disable)
    if (user.role === 'doctor') {
      const isActive = mapped === 'Active';
      await DoctorAvailability.updateMany({ doctor: user._id }, { $set: { isActive } });
    }
    await AuditService.log(req.user._id, req.user.role, 'user_updated', 'user', user._id, { field: 'status' }, { before: { status: before.status }, after: { status: user.status } }, req);
    return res.status(200).json({ message: 'User status updated successfully', user });
  } catch (error) {
    console.log('Error updating user status:', error);
    return res.status(500).json({ error: 'Failed to update user status' });
  }
};

// Create new user by admin
export const createUser = async (req, res) => {
  try {
    const { email, firstName, lastName, role, password, profile, timeZone } = req.body;
    if (!email || !firstName || !lastName || !role) return res.status(400).json({ error: 'Email, firstName, lastName, and role are required' });
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ error: 'User with this email already exists' });
    const userPassword = password || crypto.randomBytes(8).toString('hex');
    const newUser = new User({
      email,
      username: ensureUsername(email, firstName, lastName),
      password: userPassword,
      role,
      isVerified: true,
      timeZone: timeZone || 'UTC',
      status: 'Active',
      profile: { firstName, lastName, ...(profile || {}) }
    });
    await newUser.save();
    await AuditService.log(req.user._id, req.user.role, 'user_created', 'user', newUser._id, { role }, null, req);
    if (role === 'doctor') {
      const specialization = profile?.specialization;
      const licenseNumber = profile?.licenseNumber;
      if (specialization && licenseNumber) {
        await new Doctor({ user: newUser._id, specialization, licenseNumber, verificationStatus: 'approved' }).save();
      }
    }
    try { await sendWelcomeEmail(email, firstName, userPassword); } catch (e) { console.log('Failed to send welcome email:', e.message); }
    return res.status(201).json({
      message: 'User created successfully',
      user: { id: newUser._id, email: newUser.email, role: newUser.role, firstName, lastName },
      temporaryPassword: password ? undefined : userPassword
    });
  } catch (error) {
    console.log('Error creating user:', error);
    return res.status(500).json({ error: 'Failed to create user' });
  }
};

// Delete user by admin
export const deleteUser = async (req, res) => {
  try {
    const userId = req.params.userId;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Prevent deletion of admin users (except by super admin)
    if (user.role === 'admin' && !isSuperAdmin(req.user)) {
      return res.status(403).json({ error: 'Cannot delete admin user' });
    }
    
    // Prevent self-deletion
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(403).json({ error: 'Cannot delete your own account' });
    }
    
    // If user is a doctor, delete doctor profile too
    if (user.role === 'doctor') {
      await Doctor.findOneAndDelete({ user: userId });
    }
    
  // Delete the user
  await User.findByIdAndDelete(userId);
  await AuditService.log(req.user._id, req.user.role, 'user_deleted', 'user', user._id, {}, { before: user.toObject(), after: null }, req);
  res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    console.log('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
};

// Reset user password by admin
export const resetUserPassword = async (req, res) => {
  try {
    const userId = req.params.userId;
    const { newPassword, sendEmail = true } = req.body;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Generate password if not provided
    const password = newPassword || crypto.randomBytes(10).toString('hex');
    // Don't hash password here - let the User model pre-save hook handle it
    
  // Update user password
  user.password = password; // Use plain password - model will hash it
    user.passwordResetRequired = true; // Force password change on next login
    await user.save();
  await AuditService.log(req.user._id, req.user.role, 'password_changed', 'user', user._id, { resetByAdmin: true }, null, req);
    
    // Send password reset email
    if (sendEmail) {
      try {
        await sendPasswordResetEmail(user.email, user.profile?.firstName, password);
      } catch (emailError) {
        console.log('Failed to send password reset email:', emailError.message);
      }
    }
    
    res.status(200).json({
      message: 'Password reset successfully',
      temporaryPassword: newPassword ? undefined : password // Only show if auto-generated
    });
  } catch (error) {
    console.log('Error resetting password:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
};

// Bulk user operations
export const bulkUserActions = async (req, res) => {
  try {
    const { action, userIds } = req.body;
    
    if (!action || !userIds || !Array.isArray(userIds)) {
      return res.status(400).json({ error: 'Action and userIds array are required' });
    }
    
    const results = [];
    
    for (const userId of userIds) {
      try {
        const user = await User.findById(userId);
        if (!user) {
          results.push({ userId, success: false, error: 'User not found' });
          continue;
        }
        
    switch (action) {
          case 'activate':
            {
              const before = user.status;
              user.status = 'Active';
              await user.save();
              if (user.role === 'doctor') {
                await DoctorAvailability.updateMany({ doctor: user._id }, { $set: { isActive: true } });
              }
              await AuditService.log(req.user._id, req.user.role, 'user_updated', 'user', user._id, { field: 'status' }, { before: { status: before }, after: { status: 'Active' } }, req);
            }
            results.push({ userId, success: true, message: 'User activated' });
            break;
            
          case 'deactivate':
            {
              const before = user.status;
              user.status = 'Deactivated';
              await user.save();
              if (user.role === 'doctor') {
                await DoctorAvailability.updateMany({ doctor: user._id }, { $set: { isActive: false } });
              }
              await AuditService.log(req.user._id, req.user.role, 'user_updated', 'user', user._id, { field: 'status' }, { before: { status: before }, after: { status: 'Deactivated' } }, req);
            }
            results.push({ userId, success: true, message: 'User deactivated' });
            break;
            
          case 'suspend':
            {
              const before = user.status;
              user.status = 'Suspended';
              await user.save();
              if (user.role === 'doctor') {
                await DoctorAvailability.updateMany({ doctor: user._id }, { $set: { isActive: false } });
              }
              await AuditService.log(req.user._id, req.user.role, 'user_updated', 'user', user._id, { field: 'status' }, { before: { status: before }, after: { status: 'Suspended' } }, req);
            }
            results.push({ userId, success: true, message: 'User suspended' });
            break;
            
          case 'delete':
            if (user.role === 'admin' && !isSuperAdmin(req.user)) {
              results.push({ userId, success: false, error: 'Cannot delete admin user' });
              continue;
            }
            if (user._id.toString() === req.user._id.toString()) {
              results.push({ userId, success: false, error: 'Cannot delete your own account' });
              continue;
            }
            if (user.role === 'doctor') {
              await Doctor.findOneAndDelete({ user: userId });
            }
            await User.findByIdAndDelete(userId);
            await AuditService.log(req.user._id, req.user.role, 'user_deleted', 'user', user._id, {}, { before: user.toObject(), after: null }, req);
            results.push({ userId, success: true, message: 'User deleted' });
            break;
            
          default:
            results.push({ userId, success: false, error: 'Invalid action' });
        }
      } catch (error) {
        results.push({ userId, success: false, error: error.message });
      }
    }
    
    res.status(200).json({
      message: 'Bulk operation completed',
      results
    });
  } catch (error) {
    console.log('Error performing bulk operation:', error);
    res.status(500).json({ error: 'Failed to perform bulk operation' });
  }
};

// Get user statistics
export const getUserStats = async (req, res) => {
  try {
    const stats = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 },
          active: {
            $sum: {
              $cond: [{ $eq: ['$status', 'Active'] }, 1, 0]
            }
          },
          inactive: {
            $sum: {
              $cond: [{ $eq: ['$status', 'Deactivated'] }, 1, 0]
            }
          },
          suspended: {
            $sum: {
              $cond: [{ $eq: ['$status', 'Suspended'] }, 1, 0]
            }
          }
        }
      }
    ]);
    
    // Get total counts
    const totalUsers = await User.countDocuments();
    const recentUsers = await User.countDocuments({
      createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Last 30 days
    });
    
    res.status(200).json({
      totalUsers,
      recentUsers,
      byRole: stats,
      summary: {
        total: totalUsers,
        admins: stats.find(s => s._id === 'admin')?.count || 0,
        doctors: stats.find(s => s._id === 'doctor')?.count || 0,
        patients: stats.find(s => s._id === 'patient')?.count || 0
      }
    });
  } catch (error) {
    console.log('Error fetching user stats:', error);
    res.status(500).json({ error: 'Failed to fetch user statistics' });
  }
};

// Update user profile by admin
export const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    const rootEmail = process.env.ROOT_ADMIN_EMAIL || 'admin@telemedicine.com';
    if (user.role === 'admin' && !isSuperAdmin(req.user)) return res.status(403).json({ error: 'Unauthorized: Only super admin can modify admin users' });
    if (String(user.email).toLowerCase() === String(rootEmail).toLowerCase() && !isSuperAdmin(req.user)) return res.status(403).json({ error: 'Unauthorized: Cannot modify root admin' });

    const updates = req.body || {};
    const before = user.toObject();

    if (updates.role && updates.role !== user.role) {
      if (updates.role === 'doctor' && user.role !== 'doctor') {
        const specialization = updates?.profile?.specialization || user.profile?.specialization;
        const licenseNumber = updates?.profile?.licenseNumber || user.profile?.licenseNumber;
        if (specialization && licenseNumber) {
          const existingDoctor = await Doctor.findOne({ user: user._id });
          if (!existingDoctor) await new Doctor({ user: user._id, specialization, licenseNumber, verificationStatus: 'approved' }).save();
        }
      } else if (user.role === 'doctor' && updates.role !== 'doctor') {
        await Doctor.findOneAndDelete({ user: user._id });
      }
      user.role = updates.role;
    }

    const pf = updates.profile || {};
    const firstName = updates.firstName ?? pf.firstName;
    const lastName = updates.lastName ?? pf.lastName;
    user.profile = user.profile || {};
    if (firstName !== undefined) user.profile.firstName = firstName;
    if (lastName !== undefined) user.profile.lastName = lastName;
    if (updates.profile && typeof updates.profile === 'object') {
      for (const [k, v] of Object.entries(updates.profile)) {
        if (k !== 'firstName' && k !== 'lastName') user.profile[k] = v;
      }
    }

    if (isSuperAdmin(req.user)) {
      if (updates.email !== undefined) {
        const newEmail = String(updates.email).trim().toLowerCase();
        if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(newEmail)) return res.status(400).json({ error: 'Invalid email format' });
        const dupe = await User.findOne({ email: newEmail, _id: { $ne: user._id } });
        if (dupe) return res.status(400).json({ error: 'Email already in use' });
        user.email = newEmail;
      }
      if (updates.username !== undefined) {
        const newUsername = String(updates.username).trim();
        if (!newUsername) return res.status(400).json({ error: 'Username cannot be empty' });
        const dupeU = await User.findOne({ username: newUsername, _id: { $ne: user._id } });
        if (dupeU) return res.status(400).json({ error: 'Username already in use' });
        user.username = newUsername;
      }
      if (updates.timeZone !== undefined) user.timeZone = String(updates.timeZone).trim();
    }

    user.updatedAt = new Date();
    await user.save();
    await AuditService.log(req.user._id, req.user.role, 'user_updated', 'user', user._id, { fields: Object.keys(updates) }, { before, after: user.toObject() }, req);
    return res.status(200).json({
      message: 'User profile updated successfully',
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        firstName: user.profile?.firstName,
        lastName: user.profile?.lastName,
        profile: user.profile
      }
    });
  } catch (error) {
    console.log('Error updating user profile:', error);
    return res.status(500).json({ error: 'Failed to update user profile' });
  }
};

// CSV export of users (admin)
export const exportUsersCsv = async (req, res) => {
  try {
    const { role, status, search } = req.query;
    const q = {};
    if (role) q.role = role;
    if (status) q.status = normalizeStatusToModel(status) || q.status;
    if (search) {
      const re = new RegExp(search, 'i');
      q.$or = [{ email: re }, { username: re }, { 'profile.firstName': re }, { 'profile.lastName': re }];
    }
    const users = await User.find(q).select('email username role status timeZone profile.firstName profile.lastName createdAt');
    const header = 'email,username,role,status,timeZone,firstName,lastName,createdAt\n';
    const rows = users.map(u => {
      const s = normalizeStatusFromModel(u.status);
      const f = u.profile?.firstName || '';
      const l = u.profile?.lastName || '';
      return [u.email, u.username || '', u.role, s, u.timeZone || '', f, l, (u.createdAt?.toISOString?.() || '')]
        .map(v => (v == null ? '' : String(v).includes(',') ? '"' + String(v).replace(/"/g, '""') + '"' : String(v)))
        .join(',');
    });
    const csv = header + rows.join('\n');
    await AuditService.log(req.user._id, req.user.role, 'users_exported', 'user', null, { count: users.length }, null, req);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="users-export.csv"');
    return res.status(200).send(csv);
  } catch (e) {
    console.log('Error exporting users csv:', e);
    return res.status(500).json({ error: 'Failed to export users' });
  }
};

// CSV import of users (admin). Columns: email,username,role,status,timeZone,firstName,lastName
export const importUsersCsv = async (req, res) => {
  try {
    const { csv, dryRun } = req.body;
    if (!csv || typeof csv !== 'string') return res.status(400).json({ error: 'csv string body required' });
    const lines = csv.split(/\r?\n/).filter(Boolean);
    if (!lines.length) return res.status(400).json({ error: 'CSV is empty' });
    const header = lines[0].split(',').map(s => s.trim());
    const idx = (name) => header.findIndex(h => h.toLowerCase() === name);
    const iEmail = idx('email');
    const iUsername = idx('username');
    const iRole = idx('role');
    const iStatus = idx('status');
    const iTz = idx('timezone');
    const iFirst = idx('firstname');
    const iLast = idx('lastname');
    if (iEmail < 0 || iRole < 0) return res.status(400).json({ error: 'CSV must include email and role columns' });

    const results = [];
    for (let li = 1; li < lines.length; li++) {
      const raw = lines[li];
      const cols = raw.split(',');
      const email = (cols[iEmail] || '').trim().toLowerCase();
      if (!email) { results.push({ line: li + 1, ok: false, error: 'missing email' }); continue; }
      const role = (cols[iRole] || '').trim();
      if (!['admin','doctor','patient','pharmacist','laboratory'].includes(role)) { results.push({ line: li + 1, ok: false, error: 'invalid role' }); continue; }
      const statusNorm = normalizeStatusToModel((cols[iStatus] || '').trim().toLowerCase()) || 'Active';
      const firstName = (cols[iFirst] || '').trim();
      const lastName = (cols[iLast] || '').trim();
      const username = (cols[iUsername] || '').trim() || ensureUsername(email, firstName, lastName);
      const timeZone = (cols[iTz] || '').trim() || 'UTC';

      const existing = await User.findOne({ email });
      if (existing) {
        // update basic fields
        const before = existing.toObject();
        existing.role = role;
        existing.status = statusNorm;
        existing.timeZone = timeZone;
        existing.username = existing.username || username;
        existing.profile = existing.profile || {};
        if (firstName) existing.profile.firstName = firstName;
        if (lastName) existing.profile.lastName = lastName;
        if (!dryRun) await existing.save();
        results.push({ line: li + 1, ok: true, id: existing._id, action: 'updated' });
        if (!dryRun) await AuditService.log(req.user._id, req.user.role, 'user_updated', 'user', existing._id, { via: 'csv' }, { before, after: existing.toObject() }, req);
      } else {
        const user = new User({ email, username, role, status: statusNorm, timeZone, isVerified: true, profile: { firstName, lastName } });
        if (!dryRun) await user.save();
        results.push({ line: li + 1, ok: true, id: dryRun ? undefined : user._id, action: 'created' });
        if (!dryRun) await AuditService.log(req.user._id, req.user.role, 'user_created', 'user', user._id, { via: 'csv' }, null, req);
      }
    }
    await AuditService.log(req.user._id, req.user.role, 'users_imported', 'user', null, { dryRun: !!dryRun, rows: results.length }, null, req);
    return res.status(200).json({ results, dryRun: !!dryRun });
  } catch (e) {
    console.log('Error importing users csv:', e);
    return res.status(500).json({ error: 'Failed to import users' });
  }
};

// Send welcome email (helper function)
async function sendWelcomeEmail(email, firstName, password) {
  // In production, configure with real SMTP settings
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'localhost',
    port: process.env.SMTP_PORT || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
  
  const mailOptions = {
    from: process.env.FROM_EMAIL || 'noreply@telemedicine.com',
    to: email,
    subject: 'Welcome to TeleMed Platform',
    html: `
      <h2>Welcome to TeleMed Platform!</h2>
      <p>Hello ${firstName},</p>
      <p>Your account has been created by an administrator. Here are your login credentials:</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Temporary Password:</strong> ${password}</p>
      <p>Please log in and change your password immediately.</p>
      <p>Best regards,<br>TeleMed Platform Team</p>
    `
  };
  
  return transporter.sendMail(mailOptions);
}

// Send password reset email (helper function)
async function sendPasswordResetEmail(email, firstName, password) {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'localhost',
    port: process.env.SMTP_PORT || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
  
  const mailOptions = {
    from: process.env.FROM_EMAIL || 'noreply@telemedicine.com',
    to: email,
    subject: 'Password Reset - TeleMed Platform',
    html: `
      <h2>Password Reset</h2>
      <p>Hello ${firstName},</p>
      <p>Your password has been reset by an administrator. Here is your new temporary password:</p>
      <p><strong>New Password:</strong> ${password}</p>
      <p>Please log in and change your password immediately.</p>
      <p>Best regards,<br>TeleMed Platform Team</p>
    `
  };
  
  return transporter.sendMail(mailOptions);
}
