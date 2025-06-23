import axios from 'axios';

const BASE_URL = 'http://localhost:5000/api';

async function testPatientDashboardAPIs() {
  try {
    console.log('🧪 Testing Patient Dashboard API Endpoints...\n');

    // 1. Login as patient
    console.log('1. Logging in as patient...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'test.doctor@example.com', // Using any valid user
      password: 'password123'
    });

    const token = loginResponse.data.token;
    const headers = { 'Authorization': `Bearer ${token}` };

    console.log('✅ Logged in successfully\n');

    // 2. Test upcoming appointments
    console.log('2. Testing upcoming appointments...');
    try {
      const appointmentsResponse = await axios.get(`${BASE_URL}/appointments/upcoming`, { headers });
      const appointments = appointmentsResponse.data;
      
      console.log(`✅ Retrieved ${appointments.length} upcoming appointments`);
      if (appointments.length > 0) {
        const appointment = appointments[0];
        console.log('Sample appointment:');
        console.log(`   - ID: ${appointment._id}`);
        console.log(`   - Date: ${appointment.date}`);
        console.log(`   - Status: ${appointment.status}`);
        console.log(`   - Doctor structure: ${JSON.stringify(appointment.doctor, null, 2)}`);
      }
    } catch (error) {
      console.log(`⚠️  Upcoming appointments failed: ${error.response?.status}`);
    }

    // 3. Test dashboard stats
    console.log('\n3. Testing dashboard stats...');
    try {
      const statsResponse = await axios.get(`${BASE_URL}/appointments/stats`, { headers });
      const stats = statsResponse.data;
      
      console.log('✅ Retrieved dashboard stats:');
      console.log(`   - Upcoming: ${stats.upcomingCount}`);
      console.log(`   - Completed: ${stats.completedCount}`);
      console.log(`   - Today: ${stats.todayCount}`);
    } catch (error) {
      console.log(`❌ Stats failed: ${error.response?.status}`);
    }

    // 4. Test recent doctors endpoint
    console.log('\n4. Testing recent doctors endpoint...');
    try {
      const recentDoctorsResponse = await axios.get(`${BASE_URL}/patients/recent-doctors`, { headers });
      const recentDoctors = recentDoctorsResponse.data;
      
      console.log(`✅ Retrieved ${recentDoctors.length} recent doctors`);
      if (recentDoctors.length > 0) {
        console.log('Recent doctors structure:', JSON.stringify(recentDoctors[0], null, 2));
      }
    } catch (error) {
      console.log(`⚠️  Recent doctors failed: ${error.response?.status}, trying fallback...`);
      
      // Test fallback to all doctors
      try {
        const allDoctorsResponse = await axios.get(`${BASE_URL}/doctors`, { headers });
        const allDoctors = allDoctorsResponse.data;
        
        console.log(`✅ Fallback: Retrieved ${allDoctors.length} doctors`);
        if (allDoctors.length > 0) {
          console.log('Doctor structure from /doctors:', JSON.stringify(allDoctors[0], null, 2));
        }
      } catch (fallbackError) {
        console.log(`❌ Fallback also failed: ${fallbackError.response?.status}`);
      }
    }

    console.log('\n🔍 Data Structure Analysis:');
    console.log('Expected by PatientDashboardPage:');
    console.log('   - doctor.profile.fullName');
    console.log('   - doctor.profile.specialization');
    console.log('   - doctor.profile.avatar');
    
    console.log('\nActual from backend:');
    console.log('   - doctor.user.profile.fullName');
    console.log('   - doctor.specialization');
    console.log('   - doctor.user.profile.photo');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testPatientDashboardAPIs();
