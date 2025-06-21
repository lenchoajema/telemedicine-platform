#!/usr/bin/env node

import mongoose from 'mongoose';
import User from './src/modules/auth/user.model.js';

async function fixAuthUsers() {
    try {
        await mongoose.connect('mongodb://mongodb:27017/telemedicine');
        console.log('Connected to MongoDB');

        // Create/update test users with known passwords
        const testUsers = [
            {
                email: 'admin@telemedicine.com',
                password: 'admin123',
                role: 'admin',
                profile: { firstName: 'Admin', lastName: 'User' }
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
                profile: { firstName: 'Jane', lastName: 'Doe' }
            }
        ];

        // Also fix existing test users
        const existingUsers = [
            { email: 'test.doctor@example.com', password: 'password123' },
            { email: 'patient1@example.com', password: 'password123' },
            { email: 'patient2@example.com', password: 'password123' }
        ];

        // Remove all existing users and recreate them
        await User.deleteMany({});
        console.log('Cleared all users');

        for (const userData of [...testUsers, ...existingUsers]) {
            const existingUser = await User.findOne({ email: userData.email });
            if (existingUser) {
                await User.deleteOne({ email: userData.email });
            }

            // Create new user - let the model handle password hashing
            const user = new User({
                email: userData.email,
                password: userData.password,
                role: userData.role || 'patient',
                profile: userData.profile || { firstName: 'Test', lastName: 'User' },
                status: 'active'
            });

            await user.save();
            console.log(`Created user: ${userData.email} with password: ${userData.password}`);
        }

        // Test login for one user
        console.log('\nTesting login...');
        const testUser = await User.findOne({ email: 'admin@telemedicine.com' }).select('+password');
        if (testUser) {
            const isMatch = await testUser.comparePassword('admin123');
            console.log(`Password test for admin@telemedicine.com: ${isMatch}`);
        }

        console.log('\n=== LOGIN CREDENTIALS ===');
        console.log('admin@telemedicine.com / admin123');
        console.log('doctor@telemedicine.com / doctor123'); 
        console.log('patient@telemedicine.com / patient123');
        console.log('test.doctor@example.com / password123');
        console.log('patient1@example.com / password123');
        console.log('patient2@example.com / password123');

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

fixAuthUsers();
