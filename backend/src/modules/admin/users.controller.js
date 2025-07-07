import User from '../auth/user.model.js';
import Doctor from '../doctors/doctor.model.js';
import crypto from 'crypto';
import nodemailer from 'nodemailer';

// Get all users (with optional filtering)
export const getAllUsers = async (req, res) => {
  try {
    // Handle query parameters for filtering
    const { role, status, search } = req.query;
    
    // Build query
    let query = {};
    
    // Filter by role if specified
    if (role && ['admin', 'doctor', 'patient'].includes(role)) {
      query.role = role;
    }
    
    // Filter by status if specified
    if (status && ['active', 'inactive', 'suspended'].includes(status)) {
      query['status'] = status;
    }
    
    // Search by name or email if provided
    if (search) {
      query['$or'] = [
        { 'profile.firstName': { $regex: search, $options: 'i' } },
        { 'profile.lastName': { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Get users with pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 15;
    const skip = (page - 1) * limit;
    
    // Get users with selected fields
    const users = await User.find(query)
      .select('_id email profile role status createdAt lastLogin')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    // Get total count for pagination
    const total = await User.countDocuments(query);
    
    // For doctor users, get their verification status
    const usersWithDetails = await Promise.all(
      users.map(async (user) => {
        const userData = user.toObject();
        
        // Add verification status for doctors
        if (user.role === 'doctor') {
          const doctor = await Doctor.findOne({ user: user._id }).select('verificationStatus');
          userData.verificationStatus = doctor ? doctor.verificationStatus : 'pending';
        }
        
        return userData;
      })
    );
    
    res.status(200).json({
      users: usersWithDetails,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit)
      }
    });
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
      const doctor = await Doctor.findOne({ user: user._id });
      if (doctor) {
        userData.doctorDetails = doctor;
      }
    }
    
    res.status(200).json(userData);
  } catch (error) {
    console.log('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
};

// Update user status (activate, deactivate, suspend)
export const updateUserStatus = async (req, res) => {
  try {
    const userId = req.params.userId;
    const { status } = req.body;
    
    if (!status || !['active', 'inactive', 'suspended'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status value' });
    }
    
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Don't allow changing status of admin users (except by super admin)
    if (user.role === 'admin' && req.user.role !== 'super-admin') {
      return res.status(403).json({ error: 'Cannot modify admin user status' });
    }
    
    user.status = status;
    await user.save();
    
    res.status(200).json({ message: 'User status updated successfully', user });
  } catch (error) {
    console.log('Error updating user status:', error);
    res.status(500).json({ error: 'Failed to update user status' });
  }
};

// Create new user by admin
export const createUser = async (req, res) => {
  try {
    const { email, firstName, lastName, role, password, profile } = req.body;
    
    // Validate required fields
    if (!email || !firstName || !lastName || !role) {
      return res.status(400).json({ error: 'Email, firstName, lastName, and role are required' });
    }
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }
    
    // Generate password if not provided
    const userPassword = password || crypto.randomBytes(8).toString('hex');
    // Don't hash password here - let the User model pre-save hook handle it
    
    // Create user
    const newUser = new User({
      email,
      password: userPassword, // Use plain password - model will hash it
      role,
      firstName,
      lastName,
      isVerified: true, // Admin created users are auto-verified
      profile: {
        firstName,
        lastName,
        ...profile
      }
    });
    
    await newUser.save();
    
    // If user is a doctor, create doctor profile
    if (role === 'doctor') {
      const doctor = new Doctor({
        user: newUser._id,
        profile: {
          firstName,
          lastName,
          specialization: profile?.specialization || 'General Medicine',
          ...profile
        },
        verificationStatus: 'verified' // Admin created doctors are auto-verified
      });
      await doctor.save();
    }
    
    // Send welcome email with credentials (in production, use proper email service)
    try {
      await sendWelcomeEmail(email, firstName, userPassword);
    } catch (emailError) {
      console.log('Failed to send welcome email:', emailError.message);
    }
    
    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: newUser._id,
        email: newUser.email,
        role: newUser.role,
        firstName: newUser.firstName,
        lastName: newUser.lastName
      },
      temporaryPassword: password ? undefined : userPassword // Only show if auto-generated
    });
  } catch (error) {
    console.log('Error creating user:', error);
    res.status(500).json({ error: 'Failed to create user' });
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
    if (user.role === 'admin' && req.user.role !== 'super-admin') {
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
    
    // Send password reset email
    if (sendEmail) {
      try {
        await sendPasswordResetEmail(user.email, user.firstName, password);
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
            user.status = 'active';
            await user.save();
            results.push({ userId, success: true, message: 'User activated' });
            break;
            
          case 'deactivate':
            user.status = 'inactive';
            await user.save();
            results.push({ userId, success: true, message: 'User deactivated' });
            break;
            
          case 'suspend':
            user.status = 'suspended';
            await user.save();
            results.push({ userId, success: true, message: 'User suspended' });
            break;
            
          case 'delete':
            if (user.role === 'admin' && req.user.role !== 'super-admin') {
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
              $cond: [{ $eq: ['$status', 'active'] }, 1, 0]
            }
          },
          inactive: {
            $sum: {
              $cond: [{ $eq: ['$status', 'inactive'] }, 1, 0]
            }
          },
          suspended: {
            $sum: {
              $cond: [{ $eq: ['$status', 'suspended'] }, 1, 0]
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
    const userId = req.params.userId;
    const updates = req.body;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Update allowed fields
    const allowedUpdates = ['firstName', 'lastName', 'profile', 'role'];
    const actualUpdates = {};
    
    for (const key of allowedUpdates) {
      if (updates[key] !== undefined) {
        actualUpdates[key] = updates[key];
      }
    }
    
    // Special handling for role changes
    if (updates.role && updates.role !== user.role) {
      // If changing to doctor, create doctor profile
      if (updates.role === 'doctor' && user.role !== 'doctor') {
        const doctor = new Doctor({
          user: user._id,
          profile: user.profile,
          verificationStatus: 'verified'
        });
        await doctor.save();
      }
      // If changing from doctor, remove doctor profile
      else if (user.role === 'doctor' && updates.role !== 'doctor') {
        await Doctor.findOneAndDelete({ user: user._id });
      }
    }
    
    // Update user
    Object.assign(user, actualUpdates);
    user.updatedAt = new Date();
    await user.save();
    
    res.status(200).json({
      message: 'User profile updated successfully',
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        profile: user.profile
      }
    });
  } catch (error) {
    console.log('Error updating user profile:', error);
    res.status(500).json({ error: 'Failed to update user profile' });
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
