import jwt from 'jsonwebtoken';
// Corrected the import path for the User model
import User from '../models/User.js';

export const authenticate = async (req, res, next) => {
  let token;

  // Debug: log incoming headers
  console.log('Auth middleware - headers.authorization:', req.headers.authorization);
  console.log('Auth middleware - req.get("Authorization"):', req.get('Authorization'));
  // Extract token from Authorization header
  const bearer = req.headers.authorization || req.get('Authorization');
  if (bearer && bearer.toString().startsWith('Bearer ')) {
    token = bearer.toString().split(' ')[1];
    console.log('Auth middleware - token extracted:', token);
  }
  if (!token) {
    // No token provided
    return res.status(401).json({ success: false, message: 'Not authorized, no token' });
  }
  // Verify token
  try {
    console.log('Auth middleware - verifying token...');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Auth middleware - decoded token payload:', decoded);
    // Token payload uses 'id' field, not 'userId'
    const userId = decoded.id || decoded.userId;
    req.user = await User.findById(userId).select('-password');
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authorized, user not found' });
    }
    next();
  } catch (error) {
    console.log('Token verification failed:', error.message);
    return res.status(401).json({ success: false, message: 'Not authorized, token failed' });
  }
};

export const authorizeAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ success: false, message: 'Not authorized as an admin' });
    }
};

export const authorizeDoctor = (req, res, next) => {
    if (req.user && req.user.role === 'doctor') {
        next();
    } else {
        res.status(403).json({ success: false, message: 'Not authorized as a doctor' });
    }
};