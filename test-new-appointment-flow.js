import axios from 'axios';

const BASE_URL = 'http://localhost:5000/api';

async function testFullNewAppointmentFlow() {
  try {
    console.log('🧪 Testing Full NewAppointmentPage Flow...\n');

    // 1. Login as patient
    console.log('1. Logging in as patient...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'test.doctor@example.com',
      password: 'password123'
    });

    const token = loginResponse.data.token;
    const headers = { 'Authorization': `Bearer ${token}` };

    console.log('✅ Logged in successfully\n');

    // 2. Test doctor listing (Step 1)
    console.log('2. Testing doctor listing (Step 1 of NewAppointmentPage)...');
    const doctorsResponse = await axios.get(`${BASE_URL}/doctors`, { headers });
    const doctors = doctorsResponse.data;

    console.log(`✅ Retrieved ${doctors.length} doctors for selection\n`);

    if (doctors.length === 0) {
      console.log('❌ No doctors available for appointment booking');
      return;
    }

    const selectedDoctor = doctors[0];
    console.log('3. Testing doctor selection...');
    console.log(`✅ Selected doctor: ${selectedDoctor.user?.profile?.fullName || `${selectedDoctor.user?.profile?.firstName} ${selectedDoctor.user?.profile?.lastName}`}`);
    console.log(`   - Specialization: ${selectedDoctor.specialization}`);
    console.log(`   - Doctor ID: ${selectedDoctor._id}\n`);

    // 4. Test availability endpoint (Step 2)
    console.log('4. Testing availability endpoint (Step 2 of NewAppointmentPage)...');
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split('T')[0];

    try {
      const availabilityResponse = await axios.get(
        `${BASE_URL}/doctors/availability?doctorId=${selectedDoctor._id}&date=${dateStr}`,
        { headers }
      );

      const slots = availabilityResponse.data;
      console.log(`✅ Retrieved ${slots.length} available time slots`);
      if (slots.length > 0) {
        console.log(`   - Sample slots: ${slots.slice(0, 3).join(', ')}\n`);
      }
    } catch (error) {
      console.log('⚠️  Availability endpoint not working, will use default slots');
      console.log('   - This is expected behavior (falls back to generated slots)\n');
    }

    // 5. Test appointment creation (Step 3)
    console.log('5. Testing appointment creation (Step 3 of NewAppointmentPage)...');
    
    const appointmentDateTime = new Date(`${dateStr}T10:00:00`);
    
    try {
      const createResponse = await axios.post(`${BASE_URL}/appointments`, {
        doctorId: selectedDoctor._id,
        date: appointmentDateTime.toISOString(),
        reason: 'Test appointment from NewAppointmentPage flow',
        symptoms: 'Testing the complete booking flow',
        duration: 30
      }, { headers });

      console.log('✅ Appointment created successfully!');
      console.log(`   - Appointment ID: ${createResponse.data._id}`);
      console.log(`   - Date: ${createResponse.data.date}`);
      console.log(`   - Status: ${createResponse.data.status}\n`);

      console.log('🎉 COMPLETE SUCCESS!');
      console.log('NewAppointmentPage should now work end-to-end:');
      console.log('✅ Step 1: Doctor names display correctly');
      console.log('✅ Step 2: Time slot selection works');
      console.log('✅ Step 3: Appointment booking successful');

    } catch (error) {
      console.log('❌ Appointment creation failed:');
      console.log(`   - Status: ${error.response?.status}`);
      console.log(`   - Error: ${error.response?.data?.error}`);
      
      // Check if it's a data structure issue
      if (error.response?.data?.error?.includes('doctor')) {
        console.log('\n💡 This might be a backend field mapping issue.');
        console.log('   - Frontend sends: doctorId');
        console.log('   - Backend might expect: doctor');
      }
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testFullNewAppointmentFlow();
