import jwt from 'jsonwebtoken';
// Corrected the import path for the User model
import User from '../models/User.js';

export const authenticate = async (req, res, next) => {
  let token;

  // Check for token in Authorization header
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer')) {
    try {
      // Extract token from header
      token = authHeader.split(' ')[1];

      // Verify the token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      // Determine user ID from token payload (support both 'id' and 'userId')
      const userId = decoded.id || decoded.userId;
      // Attach user to the request object, excluding the password
      req.user = await User.findById(userId).select('-password');

      if (!req.user) {
        // This case handles valid token but non-existent user
        return res.status(401).json({ success: false, message: 'Not authorized, user not found' });
      }
      
      next();
    } catch (error) {
      console.log('Token verification failed:', error.message);
      return res.status(401).json({ success: false, message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    res.status(401).json({ success: false, message: 'Not authorized, no token' });
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
    // Allow only doctors or admins
    if (req.user && (req.user.role === 'doctor' || req.user.role === 'admin')) {
        return next();
    }
    res.status(403).json({ success: false, message: 'Not authorized as a doctor' });
};