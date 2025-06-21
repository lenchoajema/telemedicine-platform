#!/usr/bin/env node

import fetch from 'node-fetch';

const API_BASE = 'http://localhost:5000';

// Test function to check appointment booking issues
async function testAppointmentBookingIssues() {
  console.log('🔍 Testing Appointment Booking Issues...\n');

  try {
    // First, let's check if we have any doctors
    console.log('1. Testing Doctor Endpoints:');
    const doctorsResponse = await fetch(`${API_BASE}/api/doctors`);
    const doctors = await doctorsResponse.json();
    
    console.log(`   - Found ${doctors.length} doctors`);
    
    if (doctors.length > 0) {
      const firstDoctor = doctors[0];
      console.log('   - First doctor structure:');
      console.log(`     * ID: ${firstDoctor._id}`);
      console.log(`     * User ID: ${firstDoctor.user?._id}`);
      console.log(`     * Profile fullName: ${firstDoctor.user?.profile?.fullName}`);
      console.log(`     * Profile firstName: ${firstDoctor.user?.profile?.firstName}`);
      console.log(`     * Profile lastName: ${firstDoctor.user?.profile?.lastName}`);
      console.log(`     * Specialization: ${firstDoctor.specialization}`);
      console.log('');

      // Test getting available slots for the first doctor
      console.log('2. Testing Available Slots:');
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateStr = tomorrow.toISOString().split('T')[0];
      
      console.log(`   - Testing slots for date: ${dateStr}`);
      console.log(`   - Doctor ID: ${firstDoctor._id}`);
      
      const slotsResponse = await fetch(`${API_BASE}/api/appointments/available-slots?date=${dateStr}&doctorId=${firstDoctor._id}`);
      const slotsData = await slotsResponse.json();
      
      if (slotsResponse.ok) {
        console.log(`   - Found ${Array.isArray(slotsData) ? slotsData.length : 0} available slots`);
        if (Array.isArray(slotsData) && slotsData.length > 0) {
          console.log(`   - First few slots: ${slotsData.slice(0, 3).map(slot => new Date(slot).toLocaleTimeString()).join(', ')}`);
        } else {
          console.log('   - No slots returned (this might be the issue!)');
        }
      } else {
        console.log(`   - Error getting slots: ${slotsResponse.status} - ${JSON.stringify(slotsData)}`);
      }
      
      // Test doctor availability endpoint (alternative)
      console.log('\n3. Testing Doctor Availability Endpoint:');
      const availabilityResponse = await fetch(`${API_BASE}/api/doctors/availability?doctorId=${firstDoctor._id}&date=${dateStr}`);
      
      if (availabilityResponse.ok) {
        const availabilityData = await availabilityResponse.json();
        console.log(`   - Availability endpoint returned: ${JSON.stringify(availabilityData).substring(0, 200)}...`);
      } else {
        console.log(`   - Availability endpoint error: ${availabilityResponse.status}`);
      }
    } else {
      console.log('   - No doctors found! This might be the root issue.');
    }

  } catch (error) {
    console.error('❌ Error testing appointment booking:', error.message);
  }
}

// Run the test
testAppointmentBookingIssues();
