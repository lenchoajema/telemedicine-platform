import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Setup for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const MONGODB_URI = process.env.MONGO_URI || 'mongodb://mongodb:27017/telemedicine';

// Connect to MongoDB
mongoose.connect(MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Define User schema if it's not already imported
const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['patient', 'doctor', 'admin'],
    default: 'patient'
  },
  profile: {
    firstName: String,
    lastName: String,
    fullName: String,
    phone: String,
    photo: String,
    dateOfBirth: Date,
    gender: String,
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String
    },
    isVerified: {
      type: Boolean,
      default: false
    }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

// Add presave hook for password hashing if needed
UserSchema.pre('save', async function(next) {
  if (this.isModified('password')) {
    try {
      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(this.password, salt);
      console.log('Password hashed successfully');
    } catch (error) {
      console.error('Error hashing password:', error);
      return next(error);
    }
  }
  
  // Create fullName from firstName and lastName
  if (this.profile && (this.profile.firstName || this.profile.lastName)) {
    this.profile.fullName = [this.profile.firstName, this.profile.lastName].filter(Boolean).join(' ');
  }
  
  next();
});

// Create User model
const User = mongoose.model('User', UserSchema);

async function createAdminUser() {
  try {
    // Check if admin already exists
    const adminExists = await User.findOne({ email: 'admin@telemedicine.com' });
    
    if (adminExists) {
      console.log('Admin user already exists');
      return adminExists;
    }
    
    // Create admin user
    const admin = new User({
      email: 'admin@telemedicine.com',
      password: 'Admin@123', // This will be hashed by the pre-save hook
      role: 'admin',
      profile: {
        firstName: 'System',
        lastName: 'Administrator',
        phone: '555-ADMIN',
        isVerified: true
      },
      isActive: true
    });
    
    await admin.save();
    console.log('Admin user created successfully');
    console.log('Email: admin@telemedicine.com');
    console.log('Password: Admin@123');
    
    return admin;
  } catch (error) {
    console.error('Error creating admin user:', error);
    throw error;
  } finally {
    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('MongoDB disconnected');
  }
}

// Execute the function
createAdminUser()