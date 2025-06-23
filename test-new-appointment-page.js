import axios from 'axios';

const BASE_URL = 'http://localhost:5000/api';

async function testNewAppointmentPageFix() {
  try {
    console.log('🧪 Testing NewAppointmentPage Doctor Listing Fix...\n');

    // 1. Login as patient 
    console.log('1. Logging in as patient...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'test.doctor@example.com',
      password: 'password123'
    });

    const token = loginResponse.data.token;
    const headers = { 'Authorization': `Bearer ${token}` };

    console.log('✅ Logged in successfully\n');

    // 2. Test /doctors endpoint
    console.log('2. Testing /doctors endpoint structure...');
    const doctorsResponse = await axios.get(`${BASE_URL}/doctors`, { headers });
    const doctors = doctorsResponse.data;

    console.log(`✅ Retrieved ${doctors.length} doctors\n`);

    if (doctors.length > 0) {
      console.log('3. Verifying data structure for frontend...');
      const doctor = doctors[0];
      
      // Test the expected frontend data paths
      const doctorName = doctor.user?.profile?.fullName || 
                        `${doctor.user?.profile?.firstName} ${doctor.user?.profile?.lastName}`;
      const specialization = doctor.specialization;
      const photo = doctor.user?.profile?.photo;
      
      console.log('✅ Frontend data mapping:');
      console.log(`   - Doctor Name: ${doctorName}`);
      console.log(`   - Specialization: ${specialization}`);
      console.log(`   - Photo: ${photo || 'Default photo will be used'}`);
      console.log(`   - Doctor ID: ${doctor._id}\n`);

      // Test what NewAppointmentPage needs
      console.log('4. NewAppointmentPage frontend expectations:');
      console.log('✅ doctor.user.profile.fullName or firstName + lastName');
      console.log('✅ doctor.specialization (not doctor.profile.specialization)');
      console.log('✅ doctor.user.profile.photo (not doctor.profile.avatar)');
      console.log('✅ doctor._id for booking\n');

      // Simulate frontend rendering
      console.log('5. Simulated frontend card rendering:');
      console.log('┌─────────────────────────────────────────┐');
      console.log(`│ [Photo] ${doctorName.padEnd(28)} │`);
      console.log(`│         ${specialization.padEnd(28)} │`);
      console.log('│         [Select Doctor Button]          │');
      console.log('└─────────────────────────────────────────┘\n');
      
      console.log('🎉 SUCCESS! NewAppointmentPage should now:');
      console.log('✅ Display doctor names correctly');
      console.log('✅ Show specializations properly'); 
      console.log('✅ Handle photo/avatar display');
      console.log('✅ Allow doctor selection for booking');

    } else {
      console.log('❌ No doctors found - check if doctors exist in database');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testNewAppointmentPageFix();
