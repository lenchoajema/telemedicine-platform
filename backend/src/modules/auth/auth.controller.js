import User from './user.model.js';
import jwt from 'jsonwebtoken';

export const register = async (req, res) => {
  try {
    const user = await User.create(req.body);
    const token = generateToken(user);
    res.status(201).json({ user: safeUser(user), token });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;
  
  try {
    console.log(`Login attempt for email: ${email}`);
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      console.log(`User not found: ${email}`);
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    console.log('User found:', { email: user.email, role: user.role });
    
    const passwordMatch = await user.comparePassword(password);
    console.log('Password comparison result:', passwordMatch);
    
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const token = generateToken(user);
    console.log('Login successful, token generated');
    res.json({ user: safeUser(user), token });
  } catch (err) {
    console.error('Login error:', err);
    res.status(400).json({ error: err.message });
  }
};

export const getCurrentUser = async (req, res) => {
  try {
    res.json({ user: req.user });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Helpers
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

const safeUser = (user) => {
  const userObj = user.toObject();
  delete userObj.password;
  return userObj;
};
