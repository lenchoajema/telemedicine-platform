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
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const token = generateToken(user);
    res.json({ user: safeUser(user), token });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Add this function
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