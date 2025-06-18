#!/usr/bin/env node

// Simple script to list users from MongoDB
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// MongoDB connection
const MONGO_URI = 'mongodb://localhost:27017/telemedicine';

// User schema
const UserSchema = new mongoose.Schema({
  email: { type: String, required: true },
  role: { type: String, required: true },
  profile: {
    firstName: String,
    lastName: String,
    specialization: String,
    licenseNumber: String
  },
  status: String,
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

const User = mongoose.model('User', UserSchema);

async function listUsers() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    console.log('Connection URI:', MONGO_URI);
    
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');
    
    console.log('📋 Fetching users...');
    const users = await User.find({}).select('-password');
    
    console.log('\\n' + '='.repeat(80));
    console.log('👥 USER LIST (' + users.length + ' users found)');
    console.log('='.repeat(80));
    
    if (users.length === 0) {
      console.log('No users found in the database.');
      console.log('\\n💡 You may need to:');
      console.log('   1. Register some users through the API');
      console.log('   2. Check if the database name is correct');
      console.log('   3. Verify the MongoDB connection');
    } else {
      console.log('EMAIL'.padEnd(30) + 'ROLE'.padEnd(15) + 'NAME'.padEnd(25) + 'STATUS'.padEnd(12) + 'CREATED');
      console.log('-'.repeat(80));
      
      users.forEach((user, index) => {
        const email = user.email.padEnd(30);
        const role = (user.role || 'unknown').padEnd(15);
        const name = `${user.profile?.firstName || ''} ${user.profile?.lastName || ''}`.trim().padEnd(25);
        const status = (user.status || 'active').padEnd(12);
        const created = user.createdAt ? user.createdAt.toLocaleDateString() : 'unknown';
        
        console.log(`${email}${role}${name}${status}${created}`);
        
        // Show additional details for doctors
        if (user.role === 'doctor' && user.profile) {
          if (user.profile.specialization) {
            console.log(`   └─ Specialization: ${user.profile.specialization}`);
          }
          if (user.profile.licenseNumber) {
            console.log(`   └─ License: ${user.profile.licenseNumber}`);
          }
        }
      });
    }
    
    console.log('\\n📊 Summary:');
    const roleCounts = users.reduce((acc, user) => {
      acc[user.role] = (acc[user.role] || 0) + 1;
      return acc;
    }, {});
    
    Object.entries(roleCounts).forEach(([role, count]) => {
      console.log(`   ${role}: ${count}`);
    });
    
  } catch (error) {
    console.error('❌ Error listing users:', error.message);
    console.error('\\n🔧 Troubleshooting:');
    console.error('   1. Make sure MongoDB is running');
    console.error('   2. Check the MONGO_URI in .env file');
    console.error('   3. Verify network connectivity');
    
    if (error.message.includes('ECONNREFUSED')) {
      console.error('   → MongoDB connection refused. Is MongoDB running?');
    }
  } finally {
    await mongoose.connection.close();
    console.log('\\n🔌 Database connection closed');
  }
}

// Run the script
console.log('🚀 Starting User List Script...');
listUsers().catch(console.error);
