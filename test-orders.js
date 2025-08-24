#!/usr/bin/env node

// Tiny smoke test for Orders APIs: lab orders with and without lifecycleId
const axios = require('axios');

const baseURL = 'http://localhost:5000/api';

async function loginAdmin() {
  const candidates = [
    { email: 'admin@telemedicine.com', password: 'adminpassword123' },
    { email: 'admin@telemedicine.com', password: 'Admin@123' },
    { email: 'admin@telemedicine.com', password: 'admin123' },
  ];
  let token, lastErr;
  for (const cred of candidates) {
    try {
      const resp = await axios.post(`${baseURL}/auth/login`, cred);
      token = resp.data?.data?.token || resp.data?.token;
      if (token) {
        console.log(`Admin login OK as ${cred.email}`);
        return token;
      }
    } catch (e) {
      lastErr = e;
    }
  }
  throw new Error(`Admin login failed. Last error: ${lastErr?.response?.status} ${JSON.stringify(lastErr?.response?.data || lastErr?.message)}`);
}

async function loginDoctor() {
  const candidates = [
    { email: 'samuel.jones@telemedicine.com', password: 'doctorpassword123' },
    { email: 'test.doctor@example.com', password: 'password123' },
    { email: 'doctor@telemedicine.com', password: 'doctor123' },
    { email: 'doctor1@test.com', password: 'doctor123' },
    { email: 'doctor2@test.com', password: 'doctor123' },
  ];
  let token, lastErr;
  for (const cred of candidates) {
    try {
      const resp = await axios.post(`${baseURL}/auth/login`, cred);
      token = resp.data?.data?.token || resp.data?.token;
      if (token) {
        console.log(`Doctor login OK as ${cred.email}`);
        return token;
      }
    } catch (e) {
      lastErr = e;
    }
  }
  // Fallback: register a temporary doctor and use that token
  try {
    const suffix = Date.now();
    const email = `temp.doctor+${suffix}@example.com`;
    const password = 'Password123!';
    const username = `tempdoc${suffix}`;
    const regBody = {
      username,
      email,
      password,
      role: 'doctor',
      profile: { firstName: 'Temp', lastName: 'Doctor', title: 'Dr.' }
    };
    const reg = await axios.post(`${baseURL}/auth/register`, regBody);
    token = reg.data?.data?.token || reg.data?.token;
    if (token) {
      console.log(`Registered and logged in temp doctor: ${email}`);
      return token;
    }
    throw new Error('Registration response missing token');
  } catch (e) {
    throw new Error(`Doctor login failed and temp registration failed. Last login error: ${lastErr?.response?.status} ${JSON.stringify(lastErr?.response?.data || lastErr?.message)} | Registration error: ${e?.response?.status} ${JSON.stringify(e?.response?.data || e?.message)}`);
  }
}

async function getFirstAppointment(auth) {
  const appts = await axios.get(`${baseURL}/appointments`, auth);
  const list = appts.data?.data || appts.data || [];
  if (!Array.isArray(list) || list.length === 0) {
    throw new Error('No appointments found. Please create one and rerun.');
  }
  const appt = list[0];
  const apptId = appt?._id || appt?.id;
  const patientId = appt?.patient?._id || appt?.patient || appt?.patientId;
  if (!apptId || !patientId) throw new Error('Appointment is missing id or patient id.');
  console.log('Using appointment:', apptId, 'patient:', patientId);
  return { apptId, patientId };
}

async function main() {
  console.log('=== Orders API Smoke Test (Labs) ===');
  const adminToken = await loginAdmin();
  const auth = { headers: { Authorization: `Bearer ${adminToken}` } };

  // Health (optional but helpful)
  try {
    const hc = await axios.get(`${baseURL}/health`, auth);
    console.log('Health:', hc.data?.status || hc.data);
  } catch (e) {
    console.log('Health check skipped/failed:', e?.response?.status, e?.message);
  }

  const { apptId, patientId } = await getFirstAppointment(auth);

  // Use a doctor token for creating orders (endpoint requires doctor role)
  const doctorToken = await loginDoctor();
  const docAuth = { headers: { Authorization: `Bearer ${doctorToken}` } };

  // Create lab orders without lifecycleId
  try {
    const payload = {
      appointmentId: apptId,
      patientId,
      items: [{ testType: 'CBC' }, { testType: 'BMP' }],
      indicationText: 'Routine labs',
    };
  const resp = await axios.post(`${baseURL}/orders/labs`, payload, docAuth);
    const data = resp.data?.data || resp.data;
    console.log('Lab orders (no lifecycleId) created:', Array.isArray(data) ? data.length : 0);
  } catch (e) {
    console.error('Create labs without lifecycleId failed:', e?.response?.status, e?.response?.data || e?.message);
    process.exit(1);
  }

  // Create lab orders with lifecycleId
  try {
    const payload = {
      appointmentId: apptId,
      patientId,
      items: [{ testType: 'Lipid Panel' }],
      indicationText: 'Follow-up labs',
      lifecycleId: 'test-lifecycle-123',
    };
  const resp = await axios.post(`${baseURL}/orders/labs`, payload, docAuth);
    const data = resp.data?.data || resp.data;
    console.log('Lab orders (with lifecycleId) created:', Array.isArray(data) ? data.length : 0);
  } catch (e) {
    console.error('Create labs with lifecycleId failed:', e?.response?.status, e?.response?.data || e?.message);
    process.exit(1);
  }

  console.log('Orders API smoke test complete.');
}

main().catch((e) => {
  console.error('Fatal:', e?.message || e);
  process.exit(1);
});
