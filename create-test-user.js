// MongoDB test script to create a test user directly

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const MONGO_URI = 'mongodb://localhost:27017/telemedicine';

// Simple User schema
const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['patient', 'doctor', 'admin'], default: 'patient' },
  profile: {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true }
  },
  status: { type: String, enum: ['active', 'suspended', 'pending'], default: 'active' }
}, { timestamps: true });

// Hash password before saving
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
UserSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', UserSchema);

async function createTestUser() {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    // Remove existing test user
    await User.deleteOne({ email: 'test@example.com' });
    console.log('Removed existing test user');

    // Create new test user
    const testUser = new User({
      email: 'test@example.com',
      password: 'password123',
      role: 'patient',
      profile: {
        firstName: 'Test',
        lastName: 'User'
      },
      status: 'active'
    });

    await testUser.save();
    console.log('Test user created successfully:', {
      id: testUser._id,
      email: testUser.email,
      role: testUser.role,
      name: `${testUser.profile.firstName} ${testUser.profile.lastName}`
    });

    // Test password verification
    const isValid = await testUser.comparePassword('password123');
    console.log('Password verification test:', isValid ? 'PASS' : 'FAIL');

    // Test login query
    const foundUser = await User.findOne({ email: 'test@example.com' }).select('+password');
    if (foundUser) {
      console.log('User found via query:', {
        id: foundUser._id,
        email: foundUser.email,
        hasPassword: !!foundUser.password
      });
      const loginTest = await foundUser.comparePassword('password123');
      console.log('Login simulation test:', loginTest ? 'PASS' : 'FAIL');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

createTestUser();
