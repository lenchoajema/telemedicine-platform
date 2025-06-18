#!/usr/bin/env node

// Simplified backend test that starts a local server
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const app = express();
const PORT = 5001; // Use different port to avoid conflicts
const MONGO_URI = 'mongodb://localhost:27017/telemedicine_test';
const JWT_SECRET = 'test_jwt_secret_12345';

// Middleware
app.use(cors());
app.use(express.json());

// Simple User model for testing
const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true, select: false },
  role: { type: String, enum: ['patient', 'doctor', 'admin'], default: 'patient' },
  profile: {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true }
  },
  status: { type: String, enum: ['active', 'suspended', 'pending'], default: 'active' }
}, { timestamps: true });

UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

UserSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', UserSchema);

// Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

app.post('/api/auth/register', async (req, res) => {
  try {
    console.log('Registration attempt:', { email: req.body.email, role: req.body.role });
    
    const user = new User(req.body);
    await user.save();
    
    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    
    const userObj = user.toObject();
    delete userObj.password;
    
    console.log('Registration successful:', { id: user._id, email: user.email });
    res.status(201).json({ user: userObj, token });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('Login attempt:', { email });
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      console.log('User not found:', email);
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    console.log('User found:', { id: user._id, email: user.email });
    
    const isMatch = await user.comparePassword(password);
    console.log('Password match:', isMatch);
    
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    
    const userObj = user.toObject();
    delete userObj.password;
    
    console.log('Login successful:', { id: user._id, email: user.email });
    res.json({ user: userObj, token });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Server error', message: err.message });
});

// Start server
async function startServer() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');
    
    app.listen(PORT, () => {
      console.log(`Test server running on port ${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/api/health`);
      console.log('Ready for testing!');
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
