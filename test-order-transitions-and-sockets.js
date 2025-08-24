// E2E: Pharmacy order transitions and socket events
// Node >=18 recommended
const axios = require('axios');
const { io } = require('socket.io-client');

const BASE = process.env.API_BASE || 'http://localhost:5000/api';

async function login(email, password) {
  const resp = await axios.post(`${BASE}/auth/login`, { email, password });
  return resp.data?.token;
}

async function ensureUser(email, password, role) {
  try {
    await axios.post(`${BASE}/auth/register`, { email, password, role, firstName: role, lastName: 'Test' });
  } catch (_) {}
  const token = await login(email, password);
  return token;
}

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  console.log('🧪 E2E: Order transitions and socket events');

  // Setup users
  const doctorToken = await ensureUser('doctor.socket@test.local', 'testpass', 'doctor');
  const patientToken = await ensureUser('patient.socket@test.local', 'testpass', 'patient');
  const pharmToken = await ensureUser('pharm.socket@test.local', 'testpass', 'pharmacist');

  const headers = t => ({ headers: { Authorization: `Bearer ${t}` } });

  // Pharmacist registers a pharmacy
  await axios.post(`${BASE}/pharmacy/register`, { name: 'Socket Test Pharmacy' }, headers(pharmToken)).catch(() => {});
  const myPharmacy = await axios.get(`${BASE}/pharmacy/me`, headers(pharmToken)).then(r=>r.data?.data).catch(()=>null);

  // Doctor creates a simple prescription for the patient
  const patientPayload = (() => { try { return JSON.parse(Buffer.from(patientToken.split('.')[1],'base64').toString('utf8')); } catch { return {}; } })();
  const rx = await axios.post(`${BASE}/prescriptions`, {
    patient: patientPayload.id || patientPayload._id || patientPayload.userId,
    prescription: 'AMOX 500 1 tab BID x 5 days'
  }, headers(doctorToken)).then(r => r.data).catch(async (e) => {
    // Fallback: find any prescription
    const list = await axios.get(`${BASE}/prescriptions`, headers(doctorToken)).then(r=>r.data);
    return Array.isArray(list) && list.length ? list[0] : null;
  });
  if (!rx || !rx._id) {
    console.log('❌ Could not create or find a prescription');
    process.exit(1);
  }

  // Connect socket as patient to receive events
  const socket = io(BASE.replace('/api',''), { transports: ['websocket'] });
  const received = { order_new: false, updated: [], payloads: [] };
  await new Promise(resolve => {
    socket.on('connect', () => {
      // best-effort get userId from token payload
      try {
        const payload = JSON.parse(Buffer.from(patientToken.split('.')[1],'base64').toString('utf8'));
        if (payload?.id) socket.emit('joinUser', payload.id);
      } catch {}
      resolve();
    });
  });
  socket.on('order_new', (data) => { received.order_new = true; received.orderId = data?.orderId; received.newPayload = data; });
  socket.on('order_status_updated', (data) => { received.updated.push(data?.status); received.payloads.push(data); });

  // Route prescription to pharmacy (creates order -> emits order_new)
  const route = await axios.post(`${BASE}/prescriptions/${rx._id}/route-to-pharmacy`, { pharmacyId: myPharmacy?._id, fulfillmentType: 'Pickup' }, headers(doctorToken)).then(r=>r.data).catch(e=>({ error: e?.response?.data }));
  if (!route?.data?._id) {
    console.log('❌ Failed to route prescription:', route?.error || route);
    process.exit(1);
  }

  // Wait for socket event
  await delay(300);

  console.log('order_new socket received:', received.order_new);

  // Pharmacy transitions
  const orderId = route.data._id;
  await axios.patch(`${BASE}/pharmacy/orders/${orderId}/accept`, {}, headers(pharmToken));
  await delay(100);
  await axios.patch(`${BASE}/pharmacy/orders/${orderId}/ready`, {}, headers(pharmToken));
  await delay(100);

  // Prepare a simple inventory item and dispense
  const inv = await axios.post(`${BASE}/pharmacy/inventory`, [{ sku: 'TEST-SKU', unitPrice: 10, qtyOnHand: 5 }], headers(pharmToken)).then(r=>r.data?.data?.[0]);
  if (!inv?._id) { console.log('❌ Failed to create inventory for dispense'); process.exit(1); }
  const beforeQty = inv.qtyOnHand;
  await axios.patch(`${BASE}/pharmacy/orders/${orderId}/dispense`, { inventoryId: inv._id, qty: 2 }, headers(pharmToken));
  await delay(150);
  const invListAfter = await axios.get(`${BASE}/pharmacy/inventory?page=1&pageSize=50&sort=-updatedAt`, headers(pharmToken)).then(r=>r.data?.data || []).catch(()=>[]);
  const invAfter = invListAfter.find(x=>x._id===inv._id);
  const moves = await axios.get(`${BASE}/pharmacy/stock-movements?page=1&pageSize=5&sort=-createdAt`, headers(pharmToken)).then(r=>r.data?.data || []);

  console.log('Dispense inventory before/after:', beforeQty, invAfter?.qtyOnHand);
  console.log('Recent stock movements type list:', moves.map(m=>m.type).slice(0,3));

  console.log('order_status_updated sequence:', received.updated);
  // Basic assertions
  if (!received.order_new) { console.log('❌ Missing order_new socket'); process.exit(1); }
  if (!received.updated.includes('Accepted') || !received.updated.includes('ReadyForPickup') || !received.updated.includes('Dispensed')) {
    console.log('❌ Missing expected status updates', received.updated);
    process.exit(1);
  }
  if (!(Array.isArray(moves) && moves.find(m=>m.type==='Dispense'))) {
    console.log('❌ Missing Dispense stock movement');
    process.exit(1);
  }

  socket.disconnect();
  console.log('✅ E2E finished');
}

if (require.main === module) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
