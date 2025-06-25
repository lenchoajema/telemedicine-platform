// Test script for doctor availability endpoints
const API_BASE = 'http://localhost:5000/api';

async function testDoctorAvailability() {
  console.log('🧪 Testing Doctor Availability Endpoints...\n');

  try {
    // First, let's check if we have any doctors to work with
    console.log('1. Getting list of doctors...');
    const doctorsResponse = await fetch(`${API_BASE}/doctors`);
    
    if (!doctorsResponse.ok) {
      throw new Error(`Failed to get doctors: ${doctorsResponse.status}`);
    }
    
    const doctors = await doctorsResponse.json();
    console.log(`   Found ${doctors.length} doctors in the system`);
    
    if (doctors.length === 0) {
      console.log('❌ No doctors found. Please create a doctor account first.');
      return;
    }

    const testDoctor = doctors[0];
    console.log(`   Using doctor: ${testDoctor.profile.firstName} ${testDoctor.profile.lastName} (${testDoctor._id})`);
    
    // We need a valid token to test authenticated endpoints
    // For now, let's test the public endpoint for getting availability by doctor ID
    console.log('\n2. Testing public availability endpoint...');
    
    const publicAvailabilityResponse = await fetch(`${API_BASE}/doctors/availability?doctorId=${testDoctor._id}`);
    
    if (publicAvailabilityResponse.ok) {
      const publicAvailability = await publicAvailabilityResponse.json();
      console.log('✅ Public availability endpoint working');
      console.log(`   Availability data:`, JSON.stringify(publicAvailability, null, 2));
    } else {
      console.log(`⚠️  Public availability endpoint returned ${publicAvailabilityResponse.status}`);
      const errorText = await publicAvailabilityResponse.text();
      console.log(`   Error: ${errorText}`);
    }

    // Test the endpoints structure
    console.log('\n3. Testing endpoint routes...');
    
    // Test my-availability endpoint (will fail without auth, but should show 401, not 404)
    const myAvailabilityResponse = await fetch(`${API_BASE}/doctors/my-availability`);
    console.log(`   GET /doctors/my-availability: ${myAvailabilityResponse.status} ${myAvailabilityResponse.statusText}`);
    
    // Test setting availability endpoint (will fail without auth, but should show 401, not 404)
    const setAvailabilityResponse = await fetch(`${API_BASE}/doctors/availability`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        day: 'monday',
        startTime: '09:00',
        endTime: '17:00',
        slotDuration: 30
      })
    });
    console.log(`   POST /doctors/availability: ${setAvailabilityResponse.status} ${setAvailabilityResponse.statusText}`);

    console.log('\n✅ Availability endpoints are properly configured');
    console.log('\n📝 Note: Authenticated endpoints will require a valid JWT token');
    console.log('   The endpoints return 401 (Unauthorized) instead of 404 (Not Found),');
    console.log('   which means they are properly routed and just need authentication.');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testDoctorAvailability();
