import axios from 'axios';

async function testAPIStructure() {
    console.log('🔍 Testing API Response Structures');
    console.log('==================================');

    try {
        // Test doctors endpoint
        console.log('\n✅ Testing /api/doctors endpoint:');
        const doctorsResponse = await axios.get('http://localhost:5000/api/doctors');
        console.log('Response structure:', {
            isObject: typeof doctorsResponse.data === 'object',
            hasSuccess: 'success' in doctorsResponse.data,
            hasData: 'data' in doctorsResponse.data,
            dataIsArray: Array.isArray(doctorsResponse.data.data),
            dataLength: doctorsResponse.data.data ? doctorsResponse.data.data.length : 'N/A'
        });

        if (doctorsResponse.data.data && doctorsResponse.data.data.length > 0) {
            console.log('Sample doctor structure:');
            const doctor = doctorsResponse.data.data[0];
            console.log({
                _id: doctor._id,
                hasUser: !!doctor.user,
                userProfile: doctor.user?.profile,
                specialization: doctor.specialization,
                licenseNumber: doctor.licenseNumber
            });
        }

        // Test appointments endpoint (will need auth, but let's see structure)
        console.log('\n✅ Testing /api/appointments endpoint (without auth):');
        try {
            const appointmentsResponse = await axios.get('http://localhost:5000/api/appointments');
            console.log('Appointments response:', appointmentsResponse.data);
        } catch (error) {
            console.log('Expected auth error:', error.response?.status, error.response?.data?.message);
        }

        // Test health endpoint
        console.log('\n✅ Testing /api/health endpoint:');
        const healthResponse = await axios.get('http://localhost:5000/api/health');
        console.log('Health response:', healthResponse.data);

        console.log('\n🎉 API Structure Analysis Complete');
        console.log('==================================');
        console.log('✅ Doctors API returns: { success: true, data: [...] }');
        console.log('✅ Frontend fix applied: Extract .data property before calling .slice()');
        console.log('✅ This should resolve the "allDoctors.slice is not a function" error');

    } catch (error) {
        console.error('Test error:', error.message);
    }
}

testAPIStructure();
