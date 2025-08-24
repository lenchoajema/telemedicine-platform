const axios = require('axios');
// Hardcoded JWT for testing (provided by user)
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2ODhmYmY3MmQzZGVkNDQ3ZTVlOTk1N2EiLCJyb2xlIjoicGF0aWVudCIsImlhdCI6MTc1NDMxNTAyMiwiZXhwIjoxNzU2OTA3MDIyfQ.Mfd2OlZy6JvsUmVXADw40HW2OWb1_4nM32mgR_JEmXs';

(async () => {
  if (!token) {
    console.error('Error: Test JWT token is missing.');
    process.exit(1);
  }

  console.log('Starting reminder test script...');
  const api = axios.create({
    baseURL: 'http://localhost:5000', // use root URL and full API paths
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    timeout: 60000 // extended timeout to 60 seconds
  });

  try {
    // Fetch appointments
    console.log('Fetching appointments...');
    const apptsRes = await api.get('/api/appointments');
    const appts = apptsRes.data.data || [];
    if (!appts.length) {
      console.error('No appointments found.');
      return;
    }
    const firstAppt = appts[0];
    // Debug: log full appointment object
    console.log('First appointment object:', JSON.stringify(firstAppt, null, 2));
    const apptId = firstAppt._id;
    console.log('Using appointment ID:', apptId);
    console.log(`Appointment Details → Date: ${new Date(firstAppt.date).toLocaleString()}, Time: ${firstAppt.time || 'N/A'}, Status: ${firstAppt.status}`);

    // Schedule a Dashboard reminder for now
    console.log('Scheduling reminder...');
    const scheduleRes = await api.post('/api/reminders/schedule', {
      appointmentId: apptId,
      channels: ['Dashboard'],
      reminderTimes: [new Date().toISOString()]
    });
    const created = scheduleRes.data.data || [];
    console.log(`Created ${created.length} reminder(s):`);
    created.forEach((r) => {
      console.log(`- [${r._id}] Channel: ${r.channel}, Scheduled At: ${new Date(r.scheduledAt).toLocaleString()}, DeliveryStatus: ${r.deliveryStatus}`);
    });

    // Extract patient userId from appointment
    let userId;
    if (firstAppt.patient && typeof firstAppt.patient === 'object') {
      userId = firstAppt.patient._id || firstAppt.patient.id;
    } else {
      userId = firstAppt.patient;
    }
    console.log('Using user ID from appointment.patient:', userId);
    console.log('Listing all reminders for user...');
    const remsRes = await api.get(`/api/reminders/${userId}`);
    const allRems = remsRes.data.data || [];
    console.log(`Total reminders for user: ${allRems.length}`);
    allRems.forEach((r) => {
      console.log(`Reminder [${r._id}]: Appointment ${r.appointmentId?._id} Status: ${r.appointmentId?.status} Ch:${r.channel} At:${new Date(r.scheduledAt).toLocaleString()} Read:${r.read}`);
    });
    
    // Fetch reminders for the doctor user
    const doctorId = firstAppt.doctor._id;
    console.log('Listing all reminders for doctor user:', doctorId);
    const docRes = await api.get(`/api/reminders/${doctorId}`);
    const doctorRems = docRes.data.data || [];
    console.log(`Total reminders for doctor: ${doctorRems.length}`);
    doctorRems.forEach((r) => {
      console.log(`Doctor Reminder [${r._id}]: Appointment ${r.appointmentId?._id} Status: ${r.appointmentId?.status} Ch:${r.channel} At:${new Date(r.scheduledAt).toLocaleString()} Read:${r.read}`);
    });
  } catch (err) {
    if (err.response) {
      console.error(`API Error [${err.response.status}]:`, err.response.data);
    } else {
      console.error('Error:', err.message);
    }
    process.exit(1);
  }
})();
