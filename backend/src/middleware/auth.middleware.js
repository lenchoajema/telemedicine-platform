import jwt from 'jsonwebtoken';
import User from '../modules/auth/user.model.js';

export const authenticate = async (req, res, next) => {
  try {
    // Check for token in headers
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    // Extract token
    const token = authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    try {
      // Verify the token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
<<<<<<< HEAD
      
      // Find user
      const user = await User.findById(decoded.id).select('-password');
=======
      console.log('Decoded Token:', decoded); // Debug log for decoded token
      
      // Find user
      const user = await User.findById(decoded.id).select('-password');
      console.log('Authenticated User:', user); // Debug log for user
>>>>>>> a67abca257d39517a26d636c680d417d5adda03f
      
      if (!user) {
        return res.status(401).json({ error: 'User not found' });
      }
      
      // Attach user to request
      req.user = user;
      next();
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Token expired' });
      }
<<<<<<< HEAD
      return res.status(401).json({ error: 'Invalid token' });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
=======
      console.error('Token verification error:', error); // Debug log for token verification error
      return res.status(401).json({ error: 'Invalid token' });
    }
  } catch (error) {
    console.error('Auth middleware error:', error); // Debug log for middleware error
>>>>>>> a67abca257d39517a26d636c680d417d5adda03f
    res.status(500).json({ error: 'Server error' });
  }
};