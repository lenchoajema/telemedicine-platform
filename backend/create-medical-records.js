#!/usr/bin/env node

// Add sample medical records for testing
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Import models
import User from './src/modules/auth/user.model.js';
import MedicalRecord from './src/modules/patients/medical-record.model.js';

async function createMedicalRecords() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/telemedicine');
        console.log('Connected to MongoDB');

        // Find the test doctor and patients
        const doctor = await User.findOne({ email: 'test.doctor@example.com' });
        const patient1 = await User.findOne({ email: 'patient1@example.com' });
        const patient2 = await User.findOne({ email: 'patient2@example.com' });

        if (!doctor || !patient1 || !patient2) {
            console.log('Test users not found. Please run create-test-data.js first.');
            return;
        }

        // Clear existing medical records
        await MedicalRecord.deleteMany({});
        console.log('Cleared existing medical records');

        // Create sample medical records
        const medicalRecords = [
            {
                patient: patient1._id,
                doctor: doctor._id,
                date: new Date('2024-12-01'),
                diagnosis: 'Common Cold',
                treatment: 'Rest, fluids, and over-the-counter medications',
                notes: 'Patient presented with mild cold symptoms. Advised rest and hydration.',
                prescription: 'Paracetamol 500mg as needed for fever',
                medications: [
                    {
                        name: 'Paracetamol',
                        dosage: '500mg',
                        frequency: 'Every 6 hours as needed'
                    }
                ],
                vitals: {
                    temperature: 99.2,
                    bloodPressure: '120/80',
                    heartRate: 72
                }
            },
            {
                patient: patient1._id,
                doctor: doctor._id,
                date: new Date('2024-11-15'),
                diagnosis: 'Annual Physical Exam',
                treatment: 'Routine checkup - all normal',
                notes: 'Patient is in good health. All vital signs within normal range. Recommended annual follow-up.',
                prescription: 'Multivitamin daily',
                medications: [
                    {
                        name: 'Multivitamin',
                        dosage: '1 tablet',
                        frequency: 'Once daily'
                    }
                ],
                vitals: {
                    temperature: 98.6,
                    bloodPressure: '118/76',
                    heartRate: 68,
                    weight: 65,
                    height: 165
                }
            },
            {
                patient: patient2._id,
                doctor: doctor._id,
                date: new Date('2024-12-10'),
                diagnosis: 'Hypertension Follow-up',
                treatment: 'Continued medication, lifestyle counseling',
                notes: 'Blood pressure improved with current medication. Patient advised to continue current regimen and lifestyle modifications.',
                prescription: 'Lisinopril 10mg daily, continue current dose',
                medications: [
                    {
                        name: 'Lisinopril',
                        dosage: '10mg',
                        frequency: 'Once daily in the morning'
                    }
                ],
                vitals: {
                    temperature: 98.4,
                    bloodPressure: '135/85',
                    heartRate: 75,
                    weight: 78,
                    height: 175
                }
            },
            {
                patient: patient2._id,
                doctor: doctor._id,
                date: new Date('2024-10-20'),
                diagnosis: 'Back Pain - Muscle Strain',
                treatment: 'Physical therapy, anti-inflammatory medication',
                notes: 'Patient experienced lower back pain after lifting heavy objects. Recommended physical therapy and anti-inflammatory medication.',
                prescription: 'Ibuprofen 400mg, Physical therapy referral',
                medications: [
                    {
                        name: 'Ibuprofen',
                        dosage: '400mg',
                        frequency: 'Three times daily with food',
                        duration: '1 week'
                    }
                ],
                vitals: {
                    temperature: 98.7,
                    bloodPressure: '140/88',
                    heartRate: 78
                }
            }
        ];

        for (const recordData of medicalRecords) {
            const record = new MedicalRecord(recordData);
            await record.save();
        }

        console.log(`Created ${medicalRecords.length} medical records`);
        console.log('\nMedical records created successfully!');

    } catch (error) {
        console.error('Error creating medical records:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
}

createMedicalRecords();
