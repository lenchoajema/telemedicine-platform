const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

async function testDoctorNameDisplay() {
    console.log('🔍 Testing Doctor Name Display in Appointment System');
    console.log('====================================================');

    try {
        // Test 1: Check backend health
        console.log('\n✅ Step 1: Testing Backend Health');
        const healthResponse = await axios.get(`${BASE_URL}/health`);
        console.log('Backend Health:', healthResponse.data || 'OK');

        // Test 2: Get doctors list to see data structure
        console.log('\n✅ Step 2: Testing Doctor Data Structure');
        try {
            const doctorsResponse = await axios.get(`${BASE_URL}/doctors`);
            console.log('Doctors found:', doctorsResponse.data?.length || 0);
            
            if (doctorsResponse.data && doctorsResponse.data.length > 0) {
                const sampleDoctor = doctorsResponse.data[0];
                console.log('Sample Doctor Structure:');
                console.log('- ID:', sampleDoctor._id);
                console.log('- Name:', sampleDoctor.profile?.firstName, sampleDoctor.profile?.lastName);
                console.log('- Email:', sampleDoctor.email);
                console.log('- Specialization:', sampleDoctor.specialization || 'Not in User model');
            }
        } catch (error) {
            console.log('Doctors endpoint error:', error.message);
        }

        // Test 3: Create a test user and login to get auth token
        console.log('\n✅ Step 3: Testing Authentication for Appointment Access');
        
        const testUser = {
            email: 'test.patient@example.com',
            password: 'password123',
            profile: {
                firstName: 'Test',
                lastName: 'Patient'
            },
            role: 'patient'
        };

        let authToken = null;
        
        try {
            // Try to register a test user
            await axios.post(`${BASE_URL}/auth/register`, testUser);
            console.log('Test user created successfully');
        } catch (error) {
            console.log('Test user may already exist:', error.response?.data?.message || error.message);
        }

        try {
            // Login to get token
            const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
                email: testUser.email,
                password: testUser.password
            });
            authToken = loginResponse.data.token;
            console.log('Authentication successful');
        } catch (error) {
            console.log('Login error:', error.response?.data?.message || error.message);
        }

        // Test 4: Get appointments with proper doctor data
        if (authToken) {
            console.log('\n✅ Step 4: Testing Appointment Data with Doctor Information');
            try {
                const appointmentsResponse = await axios.get(`${BASE_URL}/appointments`, {
                    headers: { Authorization: `Bearer ${authToken}` }
                });
                
                console.log('Appointments found:', appointmentsResponse.data?.length || 0);
                
                if (appointmentsResponse.data && appointmentsResponse.data.length > 0) {
                    const sampleAppointment = appointmentsResponse.data[0];
                    console.log('\nSample Appointment Structure:');
                    console.log('- Appointment ID:', sampleAppointment._id);
                    console.log('- Date:', sampleAppointment.date);
                    console.log('- Time:', sampleAppointment.time);
                    
                    // Check doctor data structure
                    if (sampleAppointment.doctor) {
                        console.log('\nDoctor Information:');
                        console.log('- Doctor ID:', sampleAppointment.doctor._id);
                        console.log('- Doctor Name (profile):', 
                            sampleAppointment.doctor.profile?.firstName, 
                            sampleAppointment.doctor.profile?.lastName);
                        console.log('- Doctor Name (direct):', 
                            sampleAppointment.doctor.firstName, 
                            sampleAppointment.doctor.lastName);
                        console.log('- Doctor Email:', sampleAppointment.doctor.email);
                        console.log('- Doctor Specialization:', sampleAppointment.doctor.specialization);
                        console.log('- Doctor License:', sampleAppointment.doctor.license);
                        console.log('- Doctor Experience:', sampleAppointment.doctor.experience);
                        
                        // Test the display logic used in frontend
                        const displayName = sampleAppointment.doctor.profile?.firstName 
                            ? `Dr. ${sampleAppointment.doctor.profile.firstName} ${sampleAppointment.doctor.profile.lastName}`
                            : `Dr. ${sampleAppointment.doctor.firstName} ${sampleAppointment.doctor.lastName}`;
                        
                        console.log('- Display Name:', displayName);
                        console.log('- Full Display:', `${displayName} - ${sampleAppointment.doctor.specialization || 'General Practice'}`);
                    }
                }
            } catch (error) {
                console.log('Appointments endpoint error:', error.response?.data?.message || error.message);
            }
        }

        // Test 5: Check frontend is running
        console.log('\n✅ Step 5: Testing Frontend Accessibility');
        try {
            const frontendResponse = await axios.get('http://localhost:5173');
            console.log('Frontend is accessible');
        } catch (error) {
            console.log('Frontend not accessible:', error.message);
        }

        console.log('\n🎉 Doctor Name Display Test Summary');
        console.log('====================================');
        
        console.log('\n✅ Backend Enhancements Applied:');
        console.log('- Enhanced appointment.controller.js to fetch doctor specialization');
        console.log('- Added Doctor model lookup in appointment queries');
        console.log('- Updated getAppointments, getAppointmentById, createAppointment');
        
        console.log('\n✅ Frontend Updates Applied:');
        console.log('- Updated AppointmentCard.jsx with flexible doctor name handling');
        console.log('- Added fallbacks for both data structures');
        console.log('- Enhanced display with specialization information');
        
        console.log('\n✅ Mobile App Updates Applied:');
        console.log('- Updated TypeScript interfaces in AppointmentsScreen');
        console.log('- Added helper functions for name extraction');
        console.log('- Enhanced appointment display logic');
        
        console.log('\n🔍 Expected Results:');
        console.log('- Appointment booking: Shows "Dr. [FirstName] [LastName]"');
        console.log('- Patient dashboard: Shows doctor with specialization');
        console.log('- Mobile app: Proper name display with initials');
        console.log('- API responses: Complete doctor information included');

    } catch (error) {
        console.error('Test error:', error.message);
    }
}

testDoctorNameDisplay();
