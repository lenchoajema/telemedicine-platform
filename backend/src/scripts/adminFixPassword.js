import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Connect to MongoDB
mongoose.connect('mongodb://mongodb:27017/telemedicine')
  .then(() => console.log('MongoDB connected for admin password fix'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Define User Schema identical to the one in user.model.js
const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true,
    select: true // Ensure password is selectable for this script
  },
  role: {
    type: String,
    enum: ['patient', 'doctor', 'admin'],
    default: 'patient'
  },
  profile: {
    firstName: String,
    lastName: String,
    dateOfBirth: Date,
    phone: String,
    avatar: String,
    licenseNumber: String,
    specialization: String
  },
  status: {
    type: String,
    enum: ['active', 'suspended', 'pending'],
    default: 'pending'
  },
  lastLogin: Date
}, { timestamps: true });

// Intentionally not using the pre-save hook
// since we want direct control over the password hashing

// Create the model
const User = mongoose.model('User', UserSchema);

async function fixAdminPassword() {
  try {
    console.log('Finding admin user...');
    const adminEmail = 'admin@telemedicine.com';
    const plainPassword = 'Admin@123';
    
    let admin = await User.findOne({ email: adminEmail });
    
    if (!admin) {
      console.log('Admin user not found, creating new admin user...');
      
      // Hash the password
      const salt = await bcrypt.genSalt(12);
      const hashedPassword = await bcrypt.hash(plainPassword, salt);
      
      // Create admin user
      const newAdmin = new User({
        email: adminEmail,
        password: hashedPassword,
        role: 'admin',
        profile: {
          firstName: 'System',
          lastName: 'Administrator',
          phone: '555-ADMIN'
        },
        status: 'active'
      });
      
      await newAdmin.save();
      console.log('New admin user created successfully');
    } else {
      console.log('Admin user found, updating password directly...');
      
      // Generate salt and hash directly
      const salt = await bcrypt.genSalt(12);
      const hashedPassword = await bcrypt.hash(plainPassword, salt);
      
      // Update admin with new password (bypassing middleware)
      admin.password = hashedPassword;
      admin.status = 'active'; // Ensure status is active
      
      await admin.save();
      
      // Verify the hash was stored correctly
      const updatedAdmin = await User.findOne({ email: adminEmail }).select('+password');
      console.log('Updated password hash:', updatedAdmin.password);
      
      // Test the password comparison function
      const isMatch = await bcrypt.compare(plainPassword, updatedAdmin.password);
      console.log('Password verification test:', isMatch ? 'PASSED ✅' : 'FAILED ❌');
      
      console.log('Admin password updated successfully');
    }
    
    console.log('Admin credentials:');
    console.log('Email: admin@telemedicine.com');
    console.log('Password: Admin@123');
    
  } catch (error) {
    console.error('Error fixing admin password:', error);
  } finally {
    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('MongoDB disconnected');
  }
}

// Execute the function
fixAdminPassword();
