#!/usr/bin/env node

// Create sample doctor, patients, and appointments for testing
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

// Import models
import User from './src/modules/auth/user.model.js';
import Appointment from './src/modules/appointments/appointment.model.js';

async function createTestData() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/telemedicine');
        console.log('Connected to MongoDB');

        // Clear existing test data
        await User.deleteMany({ email: { $in: ['test.doctor@example.com', 'patient1@example.com', 'patient2@example.com'] } });
        await Appointment.deleteMany({});

        console.log('Cleared existing test data');

        // Create a test doctor
        const hashedPassword = await bcrypt.hash('password123', 10);
        
        const doctor = new User({
            email: 'test.doctor@example.com',
            password: hashedPassword,
            role: 'doctor',
            profile: {
                firstName: 'John',
                lastName: 'Smith',
                phone: '+1-555-0101',
                licenseNumber: 'MD12345',
                specialization: 'General Practice',
                experience: 10,
                education: 'MD from Harvard Medical School',
                bio: 'Experienced general practitioner with 10 years of practice'
            },
            verificationStatus: 'verified',
            status: 'active'
        });

        await doctor.save();
        console.log('Created test doctor:', doctor.email);

        // Create test patients
        const patient1 = new User({
            email: 'patient1@example.com',
            password: hashedPassword,
            role: 'patient',
            profile: {
                firstName: 'Alice',
                lastName: 'Johnson',
                phone: '+1-555-0201',
                dateOfBirth: new Date('1990-05-15'),
                gender: 'female',
                address: '123 Main St, City, State 12345'
            },
            status: 'active'
        });

        const patient2 = new User({
            email: 'patient2@example.com',
            password: hashedPassword,
            role: 'patient',
            profile: {
                firstName: 'Bob',
                lastName: 'Wilson',
                phone: '+1-555-0202',
                dateOfBirth: new Date('1985-08-22'),
                gender: 'male',
                address: '456 Oak Ave, City, State 12345'
            },
            status: 'active'
        });

        await patient1.save();
        await patient2.save();
        console.log('Created test patients:', patient1.email, patient2.email);

        // Create test appointments
        const appointments = [
            {
                doctor: doctor._id,
                patient: patient1._id,
                date: new Date(),
                time: '10:00 AM',
                type: 'consultation',
                reason: 'Annual checkup',
                status: 'scheduled',
                notes: 'Regular health screening'
            },
            {
                doctor: doctor._id,
                patient: patient2._id,
                date: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
                time: '2:00 PM',
                type: 'consultation',
                reason: 'Follow-up visit',
                status: 'scheduled',
                notes: 'Follow-up on previous treatment'
            },
            {
                doctor: doctor._id,
                patient: patient1._id,
                date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last week
                time: '11:30 AM',
                type: 'consultation',
                reason: 'Flu symptoms',
                status: 'completed',
                notes: 'Patient recovered well'
            }
        ];

        for (const appointmentData of appointments) {
            const appointment = new Appointment(appointmentData);
            await appointment.save();
        }

        console.log('Created test appointments:', appointments.length);
        console.log('\nTest data created successfully!');
        console.log('\nLogin credentials:');
        console.log('Doctor: test.doctor@example.com / password123');
        console.log('Patient 1: patient1@example.com / password123');
        console.log('Patient 2: patient2@example.com / password123');

    } catch (error) {
        console.error('Error creating test data:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
}

createTestData();
