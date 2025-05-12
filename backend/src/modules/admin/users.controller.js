import User from '../auth/user.model.js';
import Doctor from '../doctors/doctor.model.js';

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
    console.error('Error fetching users:', error);
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
    console.error('Error fetching user:', error);
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
    console.error('Error updating user status:', error);
    res.status(500).json({ error: 'Failed to update user status' });
  }
};
