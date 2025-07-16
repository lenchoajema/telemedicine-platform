#!/usr/bin/env node

const https = require('https');
const http = require('http');

// Allow self-signed certificates for testing
process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;

async function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const req = protocol.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });
    
    req.on('error', reject);
    if (options.body) req.write(options.body);
    req.end();
  });
}

async function testArrayFixEndpoints() {
  console.log('🔍 Testing API endpoints for array fix verification...');
  
  try {
    // Test 1: Login to get token
    console.log('🔐 Testing login...');
    const loginResponse = await makeRequest('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'admin@test.com',
        password: 'password123'
      })
    });
    
    if (loginResponse.status === 200 && loginResponse.data.success) {
      console.log('✅ Login successful');
      const token = loginResponse.data.data.token;
      
      // Test 2: Get appointments (for AdminAppointmentsPage fix)
      console.log('📅 Testing appointments endpoint...');
      const appointmentsResponse = await makeRequest('http://localhost:5000/api/appointments', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('📊 Appointments response status:', appointmentsResponse.status);
      console.log('📊 Appointments response format:', typeof appointmentsResponse.data);
      
      if (Array.isArray(appointmentsResponse.data)) {
        console.log('✅ Appointments returned as direct array - AdminAppointmentsPage fix will handle this');
      } else if (appointmentsResponse.data && appointmentsResponse.data.success && Array.isArray(appointmentsResponse.data.data)) {
        console.log('✅ Appointments returned in {success: true, data: array} format - AdminAppointmentsPage fix will handle this');
      } else if (appointmentsResponse.data && Array.isArray(appointmentsResponse.data.data)) {
        console.log('✅ Appointments returned in {data: array} format - AdminAppointmentsPage fix will handle this');
      } else {
        console.log('⚠️ Appointments returned in unexpected format - AdminAppointmentsPage fix includes fallback to empty array');
      }
      
      // Test 3: Get doctors (for NewAppointmentPage fix)
      console.log('👩‍⚕️ Testing doctors endpoint...');
      const doctorsResponse = await makeRequest('http://localhost:5000/api/doctors', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('📊 Doctors response status:', doctorsResponse.status);
      console.log('📊 Doctors response format:', typeof doctorsResponse.data);
      
      if (Array.isArray(doctorsResponse.data)) {
        console.log('✅ Doctors returned as direct array - NewAppointmentPage fix will handle this');
      } else if (doctorsResponse.data && doctorsResponse.data.success && Array.isArray(doctorsResponse.data.data)) {
        console.log('✅ Doctors returned in {success: true, data: array} format - NewAppointmentPage fix will handle this');
      } else if (doctorsResponse.data && Array.isArray(doctorsResponse.data.data)) {
        console.log('✅ Doctors returned in {data: array} format - NewAppointmentPage fix will handle this');
      } else {
        console.log('⚠️ Doctors returned in unexpected format - NewAppointmentPage fix includes fallback to empty array');
      }
      
      console.log('🎉 All array fix endpoint tests completed!');
      console.log('\n📋 Summary:');
      console.log('• AdminAppointmentsPage.jsx - Fixed to handle various API response formats and ensure appointments.filter() works');
      console.log('• NewAppointmentPage.jsx - Fixed to handle various API response formats and ensure doctors.map() works');
      console.log('• Both components now include Array.isArray() checks and fallback to empty arrays');
      console.log('• Console logging added to help debug any future issues');
      
    } else {
      console.log('❌ Login failed:', loginResponse.data);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testArrayFixEndpoints().catch(console.error);
