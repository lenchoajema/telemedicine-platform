import mongoose from 'mongoose';
import User from './src/modules/auth/user.model.js';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/telemedicine';

const testUsers = [
  {
    email: 'admin@telemedicine.com',
    password: 'admin123',
    role: 'admin',
    profile: {
      firstName: 'Admin',
      lastName: 'User'
    }
  },
  {
    email: 'doctor@telemedicine.com',
    password: 'doctor123',
    role: 'doctor',
    profile: {
      firstName: 'Dr. John',
      lastName: 'Smith',
      licenseNumber: 'MD123456',
      specialization: 'General Medicine'
    }
  },
  {
    email: 'patient@telemedicine.com',
    password: 'patient123',
    role: 'patient',
    profile: {
      firstName: 'Jane',
      lastName: 'Doe'
    }
  }
];

async function createTestUsers() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    // Clear existing users or just add new ones
    console.log('Checking existing users...');
    
    for (const userData of testUsers) {
      const existingUser = await User.findOne({ email: userData.email });
      
      if (existingUser) {
        console.log(`Updating existing user: ${userData.email}`);
        // Update password and profile
        existingUser.password = userData.password;
        existingUser.profile = { ...existingUser.profile.toObject(), ...userData.profile };
        existingUser.role = userData.role;
        existingUser.status = 'active';
        await existingUser.save();
      } else {
        console.log(`Creating new user: ${userData.email}`);
        const user = new User({
          ...userData,
          status: 'active'
        });
        await user.save();
      }
    }

    console.log('\nAll test users created/updated successfully!');
    console.log('\nTest credentials:');
    testUsers.forEach(user => {
      console.log(`Email: ${user.email} | Password: ${user.password} | Role: ${user.role}`);
    });

    // Verify users exist
    console.log('\nVerifying users in database:');
    const users = await User.find({}, { email: 1, role: 1, 'profile.firstName': 1, 'profile.lastName': 1, status: 1 });
    console.log(users);

  } catch (error) {
    console.error('Error creating test users:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    process.exit(0);
  }
}

createTestUsers();
