#!/usr/bin/env node

import mongoose from 'mongoose';
import User from './src/modules/auth/user.model.js';
import Appointment from './src/modules/appointments/appointment.model.js';
import MedicalRecord from './src/modules/patients/medical-record.model.js';

async function createSampleData() {
    try {
        await mongoose.connect('mongodb://mongodb:27017/telemedicine');
        console.log('Connected to MongoDB');

        // Get existing users
        const doctor = await User.findOne({ email: 'doctor@telemedicine.com' });
        const testDoctor = await User.findOne({ email: 'test.doctor@example.com' });
        const patient1 = await User.findOne({ email: 'patient@telemedicine.com' });
        const patient2 = await User.findOne({ email: 'patient1@example.com' });

        if (!doctor || !testDoctor || !patient1 || !patient2) {
            console.log('Some users not found, skipping data creation');
            return;
        }

        // Clear existing appointments and medical records
        await Appointment.deleteMany({});
        await MedicalRecord.deleteMany({});

        // Create sample appointments
        const appointments = [
            {
                doctor: doctor._id,
                patient: patient1._id,
                date: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
                duration: 30,
                reason: 'Regular checkup',
                status: 'scheduled'
            },
            {
                doctor: testDoctor._id,
                patient: patient2._id,
                date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // Day after tomorrow
                duration: 45,
                reason: 'Follow-up appointment',
                status: 'scheduled'
            }
        ];

        const createdAppointments = await Appointment.insertMany(appointments);
        console.log(`Created ${createdAppointments.length} appointments`);

        // Create sample medical records
        const medicalRecords = [
            {
                patient: patient1._id,
                doctor: doctor._id,
                appointment: createdAppointments[0]._id,
                date: new Date(),
                diagnosis: 'Annual physical examination',
                treatment: 'No treatment required, continue regular exercise',
                notes: 'Patient is in good health',
                prescriptions: []
            },
            {
                patient: patient2._id,
                doctor: testDoctor._id,
                date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last week
                diagnosis: 'Common cold',
                treatment: 'Rest and fluids',
                notes: 'Patient reported cold symptoms, prescribed rest',
                prescriptions: [
                    {
                        medication: 'Acetaminophen',
                        dosage: '500mg',
                        frequency: 'Every 6 hours as needed',
                        duration: '5 days'
                    }
                ]
            }
        ];

        const createdRecords = await MedicalRecord.insertMany(medicalRecords);
        console.log(`Created ${createdRecords.length} medical records`);

        console.log('\nSample data created successfully!');

    } catch (error) {
        console.error('Error creating sample data:', error);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

createSampleData();
