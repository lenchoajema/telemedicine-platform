#!/usr/bin/env node

// Debug script to check appointment data structure

const API_BASE = 'http://localhost:5000/api';

const PATIENT_CREDENTIALS = {
  email: 'patient1@example.com',
  password: 'password123'
};

async function login(credentials) {
  try {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials)
    });
    
    const data = await response.json();
    return data.token;
  } catch (error) {
    console.error('Login error:', error.message);
    return null;
  }
}

async function debugAppointmentStructure() {
  console.log('🔍 Debugging Appointment Data Structure...\n');
  
  const token = await login(PATIENT_CREDENTIALS);
  if (!token) {
    console.log('❌ Could not login');
    return;
  }

  try {
    // Get appointments data exactly as the frontend would
    const response = await fetch(`${API_BASE}/appointments/upcoming`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      console.log(`❌ API call failed: ${response.status}`);
      return;
    }

    const appointments = await response.json();
    console.log(`📊 Found ${appointments.length} appointments\n`);
    
    appointments.forEach((appointment, index) => {
      console.log(`=== Appointment ${index + 1} ===`);
      console.log(`ID: ${appointment._id}`);
      console.log(`Date: ${appointment.date}`);
      console.log(`Status: ${appointment.status}`);
      console.log(`Reason: ${appointment.reason}`);
      
      console.log(`\n🔍 Doctor field analysis:`);
      console.log(`- appointment.doctor exists: ${appointment.doctor ? '✅' : '❌'}`);
      
      if (appointment.doctor) {
        console.log(`- appointment.doctor._id: ${appointment.doctor._id || 'Missing'}`);
        console.log(`- appointment.doctor.email: ${appointment.doctor.email || 'Missing'}`);
        
        console.log(`\n📋 Profile structure:`);
        console.log(`- appointment.doctor.profile exists: ${appointment.doctor.profile ? '✅' : '❌'}`);
        
        if (appointment.doctor.profile) {
          console.log(`- appointment.doctor.profile.fullName: "${appointment.doctor.profile.fullName || 'Missing'}"`);
          console.log(`- appointment.doctor.profile.firstName: "${appointment.doctor.profile.firstName || 'Missing'}"`);
          console.log(`- appointment.doctor.profile.lastName: "${appointment.doctor.profile.lastName || 'Missing'}"`);
          console.log(`- appointment.doctor.profile.specialization: "${appointment.doctor.profile.specialization || 'Missing'}"`);
        }
        
        console.log(`\n🔍 User structure (if nested):`);
        console.log(`- appointment.doctor.user exists: ${appointment.doctor.user ? '✅' : '❌'}`);
        
        if (appointment.doctor.user) {
          console.log(`- appointment.doctor.user.profile exists: ${appointment.doctor.user.profile ? '✅' : '❌'}`);
          if (appointment.doctor.user.profile) {
            console.log(`- appointment.doctor.user.profile.fullName: "${appointment.doctor.user.profile.fullName || 'Missing'}"`);
          }
        }
      } else {
        console.log(`❌ appointment.doctor is null/undefined!`);
        console.log(`Raw appointment object keys: ${Object.keys(appointment).join(', ')}`);
      }
      
      console.log(`\n📋 Patient field analysis:`);
      console.log(`- appointment.patient exists: ${appointment.patient ? '✅' : '❌'}`);
      if (appointment.patient && appointment.patient.profile) {
        console.log(`- appointment.patient.profile.fullName: "${appointment.patient.profile.fullName || 'Missing'}"`);
      }
      
      console.log('\n' + '='.repeat(50) + '\n');
    });

    // Test with a single problematic appointment
    if (appointments.length > 0) {
      const testAppointment = appointments[0];
      console.log(`🧪 Testing doctor name extraction:`);
      
      try {
        const doctorName = testAppointment.doctor?.profile?.fullName || 
                          `${testAppointment.doctor?.profile?.firstName || ''} ${testAppointment.doctor?.profile?.lastName || ''}`.trim() || 
                          testAppointment.doctor?.user?.profile?.fullName ||
                          `${testAppointment.doctor?.user?.profile?.firstName || ''} ${testAppointment.doctor?.user?.profile?.lastName || ''}`.trim() ||
                          testAppointment.doctor?.specialization || 
                          'Unknown Doctor';
        
        console.log(`✅ Extracted doctor name: "Dr. ${doctorName}"`);
      } catch (error) {
        console.log(`❌ Error extracting doctor name: ${error.message}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Debug error:', error.message);
  }
}

debugAppointmentStructure().catch(console.error);
