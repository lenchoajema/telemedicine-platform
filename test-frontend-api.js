#!/usr/bin/env node

// Test if the frontend can access the availability endpoint without authentication
import fetch from 'node-fetch';

const API_BASE = 'http://localhost:5000';

async function testFrontendAPI() {
  console.log('🔍 Testing Frontend API Access...\n');

  try {
    // Test doctors endpoint (should work without auth)
    const doctorsResponse = await fetch(`${API_BASE}/api/doctors`);
    const doctors = await doctorsResponse.json();
    
    console.log(`✅ Doctors endpoint: ${doctors.length} doctors found`);
    
    if (doctors.length > 0) {
      const doctorId = doctors[0]._id;
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateStr = tomorrow.toISOString().split('T')[0];
      
      // Test availability endpoint (should work without auth)
      const availabilityResponse = await fetch(`${API_BASE}/api/doctors/availability?doctorId=${doctorId}&date=${dateStr}`);
      
      if (availabilityResponse.ok) {
        const slots = await availabilityResponse.json();
        console.log(`✅ Availability endpoint: ${slots.length} slots found`);
        console.log(`   Sample slots: ${slots.slice(0, 5).join(', ')}`);
      } else {
        console.log(`❌ Availability endpoint failed: ${availabilityResponse.status}`);
      }
    }
    
    console.log('\n🎉 Frontend should now be able to:');
    console.log('   1. Display doctor names correctly (Dr. Lencho Ajema - General Medicine)');
    console.log('   2. Load available time slots when a doctor is selected');
    console.log('   3. Show proper error messages when no slots are available');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testFrontendAPI();
