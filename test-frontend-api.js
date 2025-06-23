#!/usr/bin/env node

import axios from 'axios';

const BASE_URL = 'http://localhost:5000/api';

async function testDoctorsEndpoint() {
  try {
    console.log('🧪 Testing /doctors endpoint for NewAppointmentPage...\n');

    // 1. Login as patient to get token
    console.log('1. Logging in as patient...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'test.doctor@example.com', // We'll use any valid user
      password: 'password123'
    });

    const token = loginResponse.data.token;
    const headers = { 'Authorization': `Bearer ${token}` };

    console.log('✅ Logged in successfully\n');

    // 2. Test /doctors endpoint (used by NewAppointmentPage)
    console.log('2. Testing /doctors endpoint...');
    const doctorsResponse = await axios.get(`${BASE_URL}/doctors`, { headers });
    const doctors = doctorsResponse.data;

    console.log(`✅ Retrieved ${doctors.length} doctors`);
    console.log('\n📋 Doctor data structure:');
    
    if (doctors.length > 0) {
      const firstDoctor = doctors[0];
      console.log('Sample doctor object:');
      console.log(JSON.stringify(firstDoctor, null, 2));
      
      console.log('\n🔍 Key fields check:');
      console.log(`- _id: ${firstDoctor._id ? '✅' : '❌'}`);
      console.log(`- profile: ${firstDoctor.profile ? '✅' : '❌'}`);
      console.log(`- profile.fullName: ${firstDoctor.profile?.fullName ? '✅' : '❌'}`);
      console.log(`- profile.firstName: ${firstDoctor.profile?.firstName ? '✅' : '❌'}`);
      console.log(`- profile.lastName: ${firstDoctor.profile?.lastName ? '✅' : '❌'}`);
      console.log(`- profile.specialization: ${firstDoctor.profile?.specialization ? '✅' : '❌'}`);
      
      // Check name construction
      if (firstDoctor.profile?.firstName && firstDoctor.profile?.lastName) {
        console.log(`\n💡 Constructed fullName: ${firstDoctor.profile.firstName} ${firstDoctor.profile.lastName}`);
      }
    } else {
      console.log('❌ No doctors found in the response');
    }

    // 3. Compare with what the frontend expects
    console.log('\n� Frontend expectations:');
    console.log('- NewAppointmentPage expects: doctor.profile.fullName');
    console.log('- Should display in doctor cards with name and specialization');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testDoctorsEndpoint();
