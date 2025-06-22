#!/usr/bin/env node

const API_BASE = 'http://localhost:5000/api';

async function login(credentials) {
  try {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials)
    });
    
    if (!response.ok) {
      throw new Error(`Login failed: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return { token: data.token, user: data.user };
  } catch (error) {
    console.error('Login error:', error.message);
    return null;
  }
}

async function main() {
  console.log('=== APPOINTMENT DEBUG ===\n');

  // Login as patient
  const patientLogin = await login({ email: 'patient1@example.com', password: 'password123' });
  if (!patientLogin) {
    console.log('❌ Patient login failed');
    return;
  }

  console.log('Patient User ID:', patientLogin.user._id);
  console.log('Patient Role:', patientLogin.user.role);

  // Login as doctor
  const doctorLogin = await login({ email: 'test.doctor@example.com', password: 'password123' });
  if (!doctorLogin) {
    console.log('❌ Doctor login failed');
    return;
  }

  console.log('Doctor User ID:', doctorLogin.user._id);
  console.log('Doctor Role:', doctorLogin.user.role);

  // Get patient's appointments to see the doctor ID
  const appointmentsResponse = await fetch(`${API_BASE}/appointments`, {
    headers: {
      'Authorization': `Bearer ${patientLogin.token}`,
      'Content-Type': 'application/json'
    }
  });

  if (appointmentsResponse.ok) {
    const appointments = await appointmentsResponse.json();
    console.log('\nAppointment Details:');
    appointments.forEach(apt => {
      console.log(`- Appointment ID: ${apt._id}`);
      console.log(`- Patient ID: ${apt.patient._id}`);
      console.log(`- Doctor ID in Appointment: ${apt.doctor._id}`);
      console.log(`- Doctor Email in Appointment: ${apt.doctor.email}`);
      console.log(`- Status: ${apt.status}`);
      console.log(`- Date: ${apt.date}`);
      console.log('---');
    });

    // Check if doctor IDs match
    if (appointments.length > 0) {
      const appointmentDoctorId = appointments[0].doctor._id;
      const loggedInDoctorId = doctorLogin.user._id;
      console.log('\nID Comparison:');
      console.log(`Appointment Doctor ID: ${appointmentDoctorId}`);
      console.log(`Logged In Doctor ID: ${loggedInDoctorId}`);
      console.log(`IDs Match: ${appointmentDoctorId === loggedInDoctorId}`);
    }
  } else {
    console.log('❌ Failed to fetch appointments');
  }
}

main().catch(console.error);
