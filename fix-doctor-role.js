#!/usr/bin/env node

import mongoose from 'mongoose';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/telemedicine';

// Simple User schema matching the backend
const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['patient', 'doctor', 'admin'], default: 'patient' },
  profile: {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    fullName: String,
    specialization: String,
    licenseNumber: String
  }
}, { timestamps: true });

const User = mongoose.model('User', UserSchema);

async function fixDoctorRole() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✓ Connected to MongoDB');

    // Find the test doctor user
    const doctorUser = await User.findOne({ email: 'test.doctor@example.com' });
    
    if (!doctorUser) {
      console.log('❌ Doctor user not found');
      return;
    }

    console.log('Current doctor user:');
    console.log(`- ID: ${doctorUser._id}`);
    console.log(`- Email: ${doctorUser.email}`);
    console.log(`- Role: ${doctorUser.role}`);
    console.log(`- Name: ${doctorUser.profile?.fullName || doctorUser.profile?.firstName + ' ' + doctorUser.profile?.lastName}`);

    if (doctorUser.role === 'doctor') {
      console.log('✓ Doctor role is already correct');
      return;
    }

    // Update the role to doctor
    await User.updateOne(
      { _id: doctorUser._id },
      { 
        $set: { 
          role: 'doctor',
          'profile.specialization': doctorUser.profile?.specialization || 'General Medicine',
          'profile.licenseNumber': doctorUser.profile?.licenseNumber || 'MD-12345'
        }
      }
    );

    console.log('✅ Updated doctor role successfully');
    
    // Verify the update
    const updatedUser = await User.findById(doctorUser._id);
    console.log('Updated doctor user:');
    console.log(`- Role: ${updatedUser.role}`);
    console.log(`- Specialization: ${updatedUser.profile?.specialization}`);
    
  } catch (error) {
    console.error('❌ Error fixing doctor role:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✓ Disconnected from MongoDB');
  }
}

fixDoctorRole();
