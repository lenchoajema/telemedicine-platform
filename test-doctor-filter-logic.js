#!/usr/bin/env node

const API_BASE = 'http://localhost:5000/api';

const DOCTOR_CREDENTIALS = {
  email: 'test.doctor@example.com',
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
    return data;
  } catch (error) {
    console.error('Login error:', error.message);
    return null;
  }
}

async function testDoctorAppointmentFiltering() {
  console.log('🔍 Testing Doctor Appointment Filtering Logic...\n');
  
  const loginResult = await login(DOCTOR_CREDENTIALS);
  if (!loginResult || !loginResult.token) {
    console.log('❌ Could not login as doctor');
    return;
  }

  console.log('✅ Successfully logged in as doctor');
  const token = loginResult.token;

  try {
    // Test the 'all' filter (default) - /appointments endpoint
    console.log('🔍 Testing "all" filter (/appointments)...');
    const allResponse = await fetch(`${API_BASE}/appointments`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (allResponse.ok) {
      const allAppointments = await allResponse.json();
      console.log(`✅ /appointments returned ${allAppointments.length} appointments`);
      
      if (allAppointments.length > 0) {
        const apt = allAppointments[0];
        console.log('📋 Sample appointment:');
        console.log(`   - ID: ${apt._id}`);
        console.log(`   - Date: ${apt.date}`);
        console.log(`   - Status: ${apt.status}`);
        console.log(`   - Doctor populated: ${apt.doctor ? 'Yes' : 'No'}`);
        console.log(`   - Patient populated: ${apt.patient ? 'Yes' : 'No'}`);
        
        // Test the date parsing
        const appointmentDate = new Date(apt.date);
        const now = new Date();
        console.log(`   - Appointment date: ${appointmentDate.toLocaleString()}`);
        console.log(`   - Current date: ${now.toLocaleString()}`);
        console.log(`   - Is future: ${appointmentDate > now ? 'Yes' : 'No'}`);
        
        // Test filter conditions
        console.log('\n🧪 Testing filter conditions:');
        
        // Today filter test
        const today = new Date().toDateString();
        const aptDateString = new Date(apt.date).toDateString();
        console.log(`   - Today filter (${today} == ${aptDateString}): ${today === aptDateString ? 'MATCH' : 'NO MATCH'}`);
        
        // Completed filter test
        console.log(`   - Completed filter (status == 'completed'): ${apt.status === 'completed' ? 'MATCH' : 'NO MATCH'}`);
        
        // Upcoming filter test
        const isScheduled = apt.status === 'scheduled';
        const isFuture = new Date(apt.date) > new Date();
        console.log(`   - Upcoming filter (scheduled && future): scheduled=${isScheduled}, future=${isFuture}, result=${isScheduled && isFuture ? 'MATCH' : 'NO MATCH'}`);
      }
    } else {
      console.log(`❌ /appointments failed: ${allResponse.status}`);
    }

    // Test the 'upcoming' filter - /appointments/upcoming endpoint
    console.log('\n🔍 Testing "upcoming" filter (/appointments/upcoming)...');
    const upcomingResponse = await fetch(`${API_BASE}/appointments/upcoming`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (upcomingResponse.ok) {
      const upcomingAppointments = await upcomingResponse.json();
      console.log(`✅ /appointments/upcoming returned ${upcomingAppointments.length} appointments`);
      
      if (upcomingAppointments.length > 0) {
        // Simulate the double filtering issue
        let filteredData = upcomingAppointments.filter(apt => 
          apt.status === 'scheduled' && new Date(apt.date) > new Date()
        );
        console.log(`⚠️  After additional client filtering: ${filteredData.length} appointments`);
        console.log('   This is the problem! The frontend is double-filtering upcoming appointments.');
      }
    } else {
      console.log(`❌ /appointments/upcoming failed: ${upcomingResponse.status}`);
    }

  } catch (error) {
    console.error('❌ Test error:', error.message);
  }

  console.log('\n=== DIAGNOSIS ===');
  console.log('The issue is in DoctorAppointmentsPage.jsx:');
  console.log('1. For "upcoming" filter: it calls /appointments/upcoming AND then filters again');
  console.log('2. The /appointments/upcoming endpoint already returns only future scheduled appointments');
  console.log('3. The additional client-side filtering is redundant and may be too restrictive');
  console.log('');
  console.log('SOLUTION: Remove the redundant client-side filtering for "upcoming" filter');
}

testDoctorAppointmentFiltering().catch(console.error);
