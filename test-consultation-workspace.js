#!/usr/bin/env node

const axios = require('axios');

const baseURL = 'http://localhost:5000/api';

async function main() {
  console.log('=== Consultation Workspace API Smoke Test ===');

  // 1) Login as admin (has required privileges)
  const adminCandidates = [
  
    { email: 'admin@telemedicine.com', password: 'adminpassword123' },
    
  ];
  let token;
  let lastErr;
  for (const cred of adminCandidates) {
    try {
      const login = await axios.post(`${baseURL}/auth/login`, cred);
      token = login.data?.data?.token || login.data?.token;
      if (token) {
        console.log(`Admin login OK as ${cred.email}`);
        break;
      }
    } catch (e) {
      lastErr = e;
      continue;
    }
  }
  if (!token) {
    console.error('Admin login failed with all candidates:', lastErr?.response?.status, lastErr?.response?.data || lastErr?.message);
    process.exit(1);
  }

  const auth = { headers: { Authorization: `Bearer ${token}` } };

  // 2) Authenticated health check (route is protected in this setup)
  try {
    const health = await axios.get(`${baseURL}/health`, auth);
    console.log('Health:', health.data);
  } catch (e) {
    console.error('Health check failed:', e.response?.status, e.message);
    process.exit(1);
  }

  // 3) Find or create an appointment
  let apptId;
  try {
    const appts = await axios.get(`${baseURL}/appointments`, auth);
    const list = appts.data?.data || appts.data || [];
    if (Array.isArray(list) && list.length) {
      apptId = list[0]?._id || list[0]?.id;
      console.log('Using existing appointment:', apptId);
    } else {
      console.log('No appointments found; please create one and rerun.');
      process.exit(1);
    }
  } catch (e) {
    console.error('Failed to fetch appointments:', e.response?.status, e.message);
    process.exit(1);
  }

  // 4) GET chart
  try {
    const chart = await axios.get(`${baseURL}/appointments/${apptId}/chart`, auth);
    console.log('Chart loaded. Appointment:', chart.data?.data?.appointment?._id || chart.data?.appointment?._id);
  } catch (e) {
    console.error('GET chart failed:', e.response?.status, e.response?.data || e.message);
    process.exit(1);
  }

  // 5) GET templates
  try {
    const tpls = await axios.get(`${baseURL}/appointments/${apptId}/chart/note-templates`, auth);
    const items = tpls.data?.data || tpls.data || [];
    console.log(`Templates: ${Array.isArray(items) ? items.length : 0}`);
  } catch (e) {
    console.error('GET templates failed:', e.response?.status, e.response?.data || e.message);
    process.exit(1);
  }

  // 6) Create draft note
  let noteId;
  try {
    const draft = await axios.post(
      `${baseURL}/appointments/${apptId}/chart/notes`,
      {
        sectionsJSON: {
          subjective: 'Chief complaint: cough',
          objective: 'Afebrile, normal vitals',
          assessment: 'Viral URI',
          plan: 'Supportive care',
          freeText: 'Autosave test content',
        },
      },
      auth
    );
    const note = draft.data?.data || draft.data;
    noteId = note?._id || note?.id;
    console.log('Draft created:', noteId, 'status:', note?.noteStatus, 'v', note?.version);
  } catch (e) {
    console.error('Create draft failed:', e.response?.status, e.response?.data || e.message);
    process.exit(1);
  }

  // 7) Update draft (autosave simulation)
  try {
    const updated = await axios.patch(
      `${baseURL}/appointments/${apptId}/chart/notes/${noteId}`,
      { sectionsJSON: { freeText: 'Updated free text via autosave' } },
      auth
    );
    const note = updated.data?.data || updated.data;
    console.log('Draft updated: status:', note?.noteStatus, 'v', note?.version);
  } catch (e) {
    console.error('Update draft failed:', e.response?.status, e.response?.data || e.message);
    process.exit(1);
  }

  // 8) Sign note
  try {
    const signed = await axios.post(
      `${baseURL}/appointments/${apptId}/chart/notes/${noteId}/sign`,
      {},
      auth
    );
    const note = signed.data?.data || signed.data;
    console.log('Note signed: status:', note?.noteStatus, 'signedAt:', note?.signedAt);
  } catch (e) {
    console.error('Sign note failed:', e.response?.status, e.response?.data || e.message);
    process.exit(1);
  }

  console.log('All steps complete.');
}

main().catch((e) => {
  console.error('Fatal:', e);
  process.exit(1);
});
