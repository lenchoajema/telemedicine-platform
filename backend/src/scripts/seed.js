// Load environment variables from project root .env
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
// Load environment variables from project root .env
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });


import User from '../models/User.js';
import connectDB from '../modules/shared/db.js';

const seedUsers = async () => {
  try {
    await connectDB();
  // Always ensure core sample users exist (idempotent upsert style)
  const existingCount = await User.countDocuments();
  console.log(`Existing users in DB: ${existingCount}`);
  console.log('Ensuring core sample users (admin, doctor, patient)...');

  const usersToEnsure = [
      // 1. Root Admin
      {
        username: 'rootadmin',
        email: 'admin@telemedicine.com',
        password: 'adminpassword123',
        role: 'admin',
        profile: {
          firstName: 'Root',
          lastName: 'Admin',
        },
        isVerified: true,
      },
      // 2. Sample Doctor
      {
        username: 'drsamuel',
        email: 'samuel.jones@telemedicine.com',
        password: 'doctorpassword123',
        role: 'doctor',
        profile: {
          firstName: 'Samuel',
          lastName: 'Jones',
          title: 'Dr.',
        },
        isVerified: true, // Pre-verified for testing
        verificationDetails: {
            licenseNumber: 'MD123456',
            specialty: 'Cardiology', // This will be a string for now, will reference Specialty model later
            yearsOfExperience: 15,
        }
      },
      // 3. Sample Patient
      {
        username: 'jane.doe',
        email: 'jane.doe@email.com',
        password: 'patientpassword123',
        role: 'patient',
        profile: {
          firstName: 'Jane',
          lastName: 'Doe',
          dateOfBirth: new Date('1990-05-15'),
        },
      },
    ];

    const created = [];
    const skipped = [];
    for (const userData of usersToEnsure) {
      const found = await User.findOne({ email: userData.email });
      if (found) {
        skipped.push(userData.email);
        continue;
      }
      const user = await User.create(userData);
      created.push(user.email);
      console.log(`Created user: Role=${user.role}, Email=${user.email}`);
    }
    console.log(`User ensure complete. Created: ${created.length ? created.join(', ') : 'none'}; Skipped existing: ${skipped.length ? skipped.join(', ') : 'none'}`);


  } catch (error) {
    console.log('Error seeding database:', error);
    process.exit(1);
  } finally {
    mongoose.disconnect();
    console.log('Database connection closed.');
  }
};

// Export seedUsers for manual invocation
export default seedUsers;

// Allow direct execution: `node src/scripts/seed.js`
if (import.meta.url === `file://${process.argv[1]}`) {
  seedUsers().catch(err => {
    console.log('Seeding failed:', err);
    process.exit(1);
  });
}