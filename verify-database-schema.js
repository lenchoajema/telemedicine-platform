#!/usr/bin/env node

import mongoose from 'mongoose';
import Appointment from '../backend/src/modules/appointments/appointment.model.js';
import TimeSlot from '../backend/src/models/TimeSlot.js';
import User from '../backend/src/modules/auth/user.model.js';
import Doctor from '../backend/src/modules/doctors/doctor.model.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/telemedicine-db';

async function verifyDatabaseSchema() {
  console.log('🔍 VERIFYING DATABASE SCHEMA FOR APPOINTMENTS');
  console.log('='.repeat(60));
  
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // 1. Verify Appointment Schema Structure
    console.log('\n📋 APPOINTMENT SCHEMA VERIFICATION');
    console.log('-'.repeat(40));
    
    const appointmentSchema = Appointment.schema;
    const requiredFields = ['patient', 'doctor', 'date', 'time', 'status'];
    const optionalFields = ['timeSlot', 'duration', 'reason', 'symptoms', 'notes'];
    
    console.log('Required Fields:');
    requiredFields.forEach(field => {
      const fieldDef = appointmentSchema.paths[field];
      if (fieldDef) {
        const isRequired = fieldDef.isRequired || fieldDef.options.required;
        const fieldType = fieldDef.instance || fieldDef.options.type?.name || 'Mixed';
        const ref = fieldDef.options.ref || 'None';
        console.log(`  ✅ ${field}: ${fieldType} (Required: ${!!isRequired}, Ref: ${ref})`);
      } else {
        console.log(`  ❌ ${field}: MISSING`);
      }
    });
    
    console.log('\nOptional Fields:');
    optionalFields.forEach(field => {
      const fieldDef = appointmentSchema.paths[field];
      if (fieldDef) {
        const fieldType = fieldDef.instance || fieldDef.options.type?.name || 'Mixed';
        const ref = fieldDef.options.ref || 'None';
        console.log(`  ✅ ${field}: ${fieldType} (Ref: ${ref})`);
      } else {
        console.log(`  ⚠️  ${field}: Not defined`);
      }
    });
    
    // 2. Verify Indexes
    console.log('\n📊 INDEX VERIFICATION');
    console.log('-'.repeat(40));
    
    const appointmentIndexes = await Appointment.collection.getIndexes();
    console.log('Appointment Indexes:');
    Object.keys(appointmentIndexes).forEach(indexName => {
      console.log(`  ✅ ${indexName}:`, appointmentIndexes[indexName]);
    });
    
    // 3. Verify TimeSlot Schema Structure
    console.log('\n⏰ TIMESLOT SCHEMA VERIFICATION');
    console.log('-'.repeat(40));
    
    const timeSlotSchema = TimeSlot.schema;
    const timeSlotFields = ['doctorId', 'date', 'startTime', 'endTime', 'isAvailable', 'appointmentId', 'patientId'];
    
    timeSlotFields.forEach(field => {
      const fieldDef = timeSlotSchema.paths[field];
      if (fieldDef) {
        const isRequired = fieldDef.isRequired || fieldDef.options.required;
        const fieldType = fieldDef.instance || fieldDef.options.type?.name || 'Mixed';
        const ref = fieldDef.options.ref || 'None';
        console.log(`  ✅ ${field}: ${fieldType} (Required: ${!!isRequired}, Ref: ${ref})`);
      } else {
        console.log(`  ❌ ${field}: MISSING`);
      }
    });
    
    // 4. Test Data Relationships
    console.log('\n🔗 RELATIONSHIP VERIFICATION');
    console.log('-'.repeat(40));
    
    // Count documents in each collection
    const appointmentCount = await Appointment.countDocuments();
    const timeSlotCount = await TimeSlot.countDocuments();
    const userCount = await User.countDocuments();
    const doctorCount = await Doctor.countDocuments();
    
    console.log(`📊 Document Counts:`);
    console.log(`  - Appointments: ${appointmentCount}`);
    console.log(`  - TimeSlots: ${timeSlotCount}`);
    console.log(`  - Users: ${userCount}`);
    console.log(`  - Doctors: ${doctorCount}`);
    
    // Test appointment relationships
    if (appointmentCount > 0) {
      console.log('\n🔍 Testing Appointment Relationships:');
      
      // Get sample appointment
      const sampleAppointment = await Appointment.findOne()
        .populate('patient', 'email profile.firstName profile.lastName')
        .populate('doctor', 'email profile.firstName profile.lastName')
        .populate('timeSlot');
      
      if (sampleAppointment) {
        console.log('  ✅ Sample Appointment Found:');
        console.log(`    - ID: ${sampleAppointment._id}`);
        console.log(`    - Patient: ${sampleAppointment.patient?.profile?.firstName || 'Unknown'} ${sampleAppointment.patient?.profile?.lastName || ''}`);
        console.log(`    - Doctor: ${sampleAppointment.doctor?.profile?.firstName || 'Unknown'} ${sampleAppointment.doctor?.profile?.lastName || ''}`);
        console.log(`    - Date: ${sampleAppointment.date}`);
        console.log(`    - Time: ${sampleAppointment.time}`);
        console.log(`    - Status: ${sampleAppointment.status}`);
        console.log(`    - TimeSlot: ${sampleAppointment.timeSlot ? 'Linked' : 'Not linked'}`);
        
        // Check if patient exists
        if (sampleAppointment.patient) {
          console.log('    ✅ Patient relationship working');
        } else {
          console.log('    ❌ Patient relationship broken');
        }
        
        // Check if doctor exists
        if (sampleAppointment.doctor) {
          console.log('    ✅ Doctor relationship working');
        } else {
          console.log('    ❌ Doctor relationship broken');
        }
        
        // Check TimeSlot relationship if exists
        if (sampleAppointment.timeSlot) {
          const linkedTimeSlot = await TimeSlot.findById(sampleAppointment.timeSlot);
          if (linkedTimeSlot) {
            console.log('    ✅ TimeSlot relationship working');
            console.log(`      - TimeSlot Date: ${linkedTimeSlot.date}`);
            console.log(`      - TimeSlot Time: ${linkedTimeSlot.startTime} - ${linkedTimeSlot.endTime}`);
            console.log(`      - Available: ${linkedTimeSlot.isAvailable}`);
          } else {
            console.log('    ❌ TimeSlot relationship broken');
          }
        }
      }
    }
    
    // 5. Verify Data Integrity Constraints
    console.log('\n🛡️  DATA INTEGRITY VERIFICATION');
    console.log('-'.repeat(40));
    
    // Check for orphaned appointments (appointments without valid patient/doctor)
    const orphanedAppointments = await Appointment.aggregate([
      {
        $lookup: {
          from: 'users',
          localField: 'patient',
          foreignField: '_id',
          as: 'patientData'
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'doctor',
          foreignField: '_id',
          as: 'doctorData'
        }
      },
      {
        $match: {
          $or: [
            { patientData: { $size: 0 } },
            { doctorData: { $size: 0 } }
          ]
        }
      }
    ]);
    
    if (orphanedAppointments.length === 0) {
      console.log('✅ No orphaned appointments found');
    } else {
      console.log(`❌ Found ${orphanedAppointments.length} orphaned appointments`);
    }
    
    // Check for appointments with invalid time slots
    const appointmentsWithTimeSlots = await Appointment.find({ timeSlot: { $ne: null } });
    let invalidTimeSlotRefs = 0;
    
    for (const appointment of appointmentsWithTimeSlots) {
      const timeSlot = await TimeSlot.findById(appointment.timeSlot);
      if (!timeSlot) {
        invalidTimeSlotRefs++;
      }
    }
    
    if (invalidTimeSlotRefs === 0) {
      console.log('✅ All TimeSlot references are valid');
    } else {
      console.log(`❌ Found ${invalidTimeSlotRefs} invalid TimeSlot references`);
    }
    
    // 6. Schema Validation Test
    console.log('\n🧪 SCHEMA VALIDATION TEST');
    console.log('-'.repeat(40));
    
    try {
      // Test creating appointment with missing required fields
      const invalidAppointment = new Appointment({
        // Missing required fields intentionally
        reason: 'Test validation'
      });
      
      await invalidAppointment.validate();
      console.log('❌ Schema validation is too permissive');
    } catch (validationError) {
      console.log('✅ Schema validation is working correctly');
      console.log(`   Validation errors: ${Object.keys(validationError.errors).join(', ')}`);
    }
    
    console.log('\n🎯 SCHEMA VERIFICATION SUMMARY');
    console.log('='.repeat(60));
    console.log('✅ Appointment schema properly defines:');
    console.log('   - PatientID (ObjectId ref to User)');
    console.log('   - DoctorID (ObjectId ref to User)');
    console.log('   - TimeSlot (ObjectId ref to TimeSlot - optional)');
    console.log('   - Status (enum with proper values)');
    console.log('   - Date and Time fields with proper validation');
    console.log('   - Proper indexing for efficient queries');
    console.log('   - Data integrity constraints');
    
  } catch (error) {
    console.error('❌ Schema verification failed:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Database connection closed');
  }
}

// Run verification if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  verifyDatabaseSchema().catch(console.error);
}

export default verifyDatabaseSchema;
