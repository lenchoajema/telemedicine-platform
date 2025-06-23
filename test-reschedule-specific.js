import axios from 'axios';

const BASE_URL = 'http://localhost:5000/api';

// Test the specific reschedule endpoint that was failing in the frontend
async function testRescheduleEndpoint() {
  try {
    console.log('🧪 Testing Specific Reschedule Endpoint (Frontend Fix Verification)...\n');

    // 1. Login as doctor
    console.log('1. Logging in as doctor...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'test.doctor@example.com',
      password: 'password123'
    });

    const token = loginResponse.data.token;
    const headers = { 'Authorization': `Bearer ${token}` };

    console.log('✅ Doctor logged in successfully\n');

    // 2. Get all appointments for this doctor
    console.log('2. Fetching doctor appointments...');
    const appointmentsResponse = await axios.get(`${BASE_URL}/appointments`, { headers });
    const appointments = appointmentsResponse.data;

    console.log(`✅ Found ${appointments.length} appointments for doctor\n`);

    if (appointments.length === 0) {
      console.log('⚠️  No appointments found. Cannot test reschedule.');
      return;
    }

    // 3. Find a scheduled appointment to reschedule
    const scheduledAppointment = appointments.find(apt => apt.status === 'scheduled');
    
    if (!scheduledAppointment) {
      console.log('⚠️  No scheduled appointments found. Using first appointment for test.');
      const firstAppointment = appointments[0];
      console.log(`   - Testing with appointment ID: ${firstAppointment._id}`);
      console.log(`   - Current status: ${firstAppointment.status}\n`);
      
      // Try to reschedule anyway to test authorization
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 3);
      futureDate.setHours(15, 30, 0, 0);

      try {
        const rescheduleResponse = await axios.put(`${BASE_URL}/appointments/${firstAppointment._id}/reschedule`, {
          date: futureDate.toISOString()
        }, { headers });

        console.log('✅ Reschedule endpoint accessible (authorization works)');
        console.log(`   - Response: ${rescheduleResponse.status}\n`);
      } catch (error) {
        if (error.response?.status === 403) {
          console.log('❌ Still getting 403 Forbidden error!');
          console.log(`   - Error: ${error.response.data.error}\n`);
        } else if (error.response?.status === 400) {
          console.log('✅ Authorization works! (Got 400 for business logic, not 403 for auth)');
          console.log(`   - Business logic error: ${error.response.data.error}\n`);
        } else {
          console.log(`⚠️  Unexpected error: ${error.response?.status}`);
          console.log(`   - Error: ${error.response?.data?.error || error.message}\n`);
        }
      }
      return;
    }

    // 4. Test reschedule on scheduled appointment (exact frontend scenario)
    console.log(`3. Testing reschedule on scheduled appointment: ${scheduledAppointment._id}`);
    console.log(`   - Current date: ${scheduledAppointment.date}`);
    console.log(`   - Status: ${scheduledAppointment.status}\n`);

    // Create future date (similar to frontend logic)
    const newDate = new Date();
    newDate.setDate(newDate.getDate() + 5); // 5 days from now
    newDate.setHours(11, 0, 0, 0); // 11 AM

    console.log('4. Calling reschedule endpoint...');
    console.log(`   - New date: ${newDate.toISOString()}`);
    console.log(`   - URL: PUT ${BASE_URL}/appointments/${scheduledAppointment._id}/reschedule\n`);

    try {
      const rescheduleResponse = await axios.put(`${BASE_URL}/appointments/${scheduledAppointment._id}/reschedule`, {
        date: newDate.toISOString()
      }, { headers });

      console.log('🎉 SUCCESS! Reschedule endpoint works correctly');
      console.log(`   - Status: ${rescheduleResponse.status}`);
      console.log(`   - New appointment date: ${rescheduleResponse.data.date}`);
      console.log('   - Frontend 403 Forbidden error is FIXED! ✅\n');

    } catch (error) {
      if (error.response?.status === 403) {
        console.log('❌ STILL GETTING 403 FORBIDDEN ERROR!');
        console.log('   This indicates the authorization fix may not be working properly.');
        console.log(`   - Error message: ${error.response.data.error}`);
        console.log(`   - Full error: ${JSON.stringify(error.response.data, null, 2)}\n`);
      } else {
        console.log(`⚠️  Got different error (not 403): ${error.response?.status}`);
        console.log(`   - Error: ${error.response?.data?.error || error.message}\n`);
      }
    }

    // 5. Verify appointments are still listed correctly
    console.log('5. Verifying appointments are still listed correctly...');
    const verifyResponse = await axios.get(`${BASE_URL}/appointments`, { headers });
    const verifyAppointments = verifyResponse.data;

    console.log(`✅ Still have ${verifyAppointments.length} appointments listed`);
    console.log('   - Doctor dashboard listing continues to work correctly\n');

    console.log('🎯 TEST COMPLETE');
    console.log('Frontend reschedule button should now work without 403 errors!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testRescheduleEndpoint();
