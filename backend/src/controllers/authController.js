import User from '../models/User.js';
import generateToken from '../utils/generateToken.js';
import NotificationService from '../services/NotificationService.js';
import AuditService from '../services/AuditService.js';
//import NotificationService from '../services/NotificationService.js';
//import AuditService from '../services/AuditService.js';
//import NotificationService from '../services/NotificationService.js';
//import AuditService from '../services/AuditService.js';

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  let { email, password } = req.body;
  // Validate input
  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required' });
  }
  // Normalize email for case-insensitive matching
  email = email.toLowerCase();
  try {
    // Find user and include password field
    const user = await User.findOne({ email }).select('+password');
    console.log('User from DB:', user);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }
    // Compare password
    const isMatch = await user.matchPassword(password);
    console.log('Password match:', isMatch);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }
    // Generate token
    const token = generateToken(res, user._id, user.role);
    console.log('Generated token:', token);
    // Set token as HTTP-only cookie for subsequent requests
    // Set HTTP-only cookie for JWT; use 'lax' in development, 'none' with secure in production
    // Set HTTP-only cookie; in dev use SameSite=Lax, in prod use SameSite=None with Secure
    const isProd = process.env.NODE_ENV === 'production';
    res.cookie('token', token, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      path: '/',
    });
    // Dispatch login notification and audit log
    await NotificationService.dispatchEvent('UserLogin', `User ${user.email} logged in at ${new Date().toISOString()}`, null, user.role);
    await AuditService.log(user._id, user.role, 'user_login', 'user', user._id, { ipAddress: req.ip }, null, req);
    // Dispatch login notification and audit log
    await NotificationService.dispatchEvent('UserLogin', `User ${user.email} logged in at ${new Date().toISOString()}`);
    await AuditService.log(user._id, user.role, 'user_login', 'user', user._id, { ipAddress: req.ip }, null, req);
    // Respond with user data and token
    return res.json({
      success: true,
      data: {
        user: {
          _id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          profile: user.profile,
        },
        token,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// @desc    Logout user and record event
// @route   POST /api/auth/logout
// @access  Private
const logoutUser = async (req, res) => {
  try {
    const user = req.user;
    await NotificationService.dispatchEvent('UserLogout', `User ${user.email} logged out at ${new Date().toISOString()}`);
    await AuditService.log(user._id, user.role, 'user_logout', 'user', user._id, { ipAddress: req.ip }, null, req);
    return res.json({ success: true, message: 'Logged out successfully' });
  } catch (err) {
    console.log('Logout error:', err);
    return res.status(500).json({ success: false, message: 'Logout failed' });
  }
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  const { username: reqUsername, email, password, role, profile = {} } = req.body;
  // Validate required registration fields
  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required' });
  }
  // Use email as username if username not provided
  const username = reqUsername || email;
  // Extract profile info and doctor-specific fields
  const { licenseNumber, specialization, ...profileInfo } = profile;

  try {
    console.log('Register request body:', req.body);
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    // Build user document
    const userData = {
      username,
      email,
      password,
      role,
      profile: profileInfo,
    };
    console.log('User data for registration:', userData);
    // If registering as doctor, move license and specialty into verificationDetails
    if (role === 'doctor') {
      userData.verificationDetails = {
        licenseNumber: licenseNumber || '',
        specialty: specialization || '',
      };
    }
    const user = await User.create(userData);

    if (user) {
      const token = generateToken(res, user._id, user.role);
      res.status(201).json({
        success: true,
        data: {
          user: {
            _id: user._id,
            username: user.username,
            email: user.email,
            role: user.role,
            profile: user.profile,
          },
          token,
        },
      });
    } else {
      res.status(400).json({ success: false, message: 'Invalid user data' });
    }
  } catch (error) {
    console.log('Error in registerUser:', error);
    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// @desc    Get current authenticated user
// @route   GET /api/auth/me
// @access  Private
const getCurrentUser = async (req, res) => {
  try {
    // req.user is set by the auth middleware and contains the user ID
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    // Fetch the full user details from the database, excluding the password
    const user = await User.findById(req.user._id).select('-password');

    if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({
      success: true,
      data: {
        user,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

export { loginUser, registerUser, getCurrentUser, logoutUser };