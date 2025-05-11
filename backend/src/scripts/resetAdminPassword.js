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

const MONGODB_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/telemedicine';

console.log('Connecting to MongoDB at:', MONGODB_URI);

// Connect to MongoDB
mongoose.connect(MONGODB_URI)
  .then(() => console.log('MongoDB connected for admin reset'))
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

// Create User model
const User = mongoose.model('User', UserSchema);

async function resetAdminPassword() {
  try {
    // Find admin user
    const admin = await User.findOne({ email: 'admin@telemedicine.com' });
    
    if (!admin) {
      console.log('Admin user not found, creating new admin user...');
      // Create admin user
      const newAdmin = new User({
        email: 'admin@telemedicine.com',
        password: await bcrypt.hash('Admin@123', 10),
        role: 'admin',
        profile: {
          firstName: 'System',
          lastName: 'Administrator',
          phone: '555-ADMIN',
          isVerified: true
        },
        isActive: true
      });
      
      await newAdmin.save();
      console.log('New admin user created successfully');
    } else {
      console.log('Admin user found, resetting password...');
      // Reset password
      admin.password = await bcrypt.hash('Admin@123', 10);
      await admin.save();
      console.log('Admin password reset successfully');
    }
    
    console.log('Admin credentials:');
    console.log('Email: admin@telemedicine.com');
    console.log('Password: Admin@123');
    
  } catch (error) {
    console.error('Error resetting admin password:', error);
    throw error;
  } finally {
    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('MongoDB disconnected');
  }
}

// Execute the function
resetAdminPassword();
