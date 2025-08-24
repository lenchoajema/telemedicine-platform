// Minimal admin endpoints test: create -> toggle -> delete for services, pricebooks, plans
// Usage: node admin-pricing-endpoints.test.js
// Requires: API_URL, ADMIN_EMAIL, ADMIN_PASSWORD env vars or falls back to localhost and default admin

const axios = require('axios');

const API_URL = process.env.API_URL || 'http://localhost:5000/api';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin+pricing@test.local';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Passw0rd!';

async function ensureAdminToken() {
  try {
    // Try login
    const r = await axios.post(`${API_URL}/auth/login`, { email: ADMIN_EMAIL, password: ADMIN_PASSWORD }).catch(() => null);
    if (r?.data?.token || r?.data?.data?.token) {
      return r.data.token || r.data.data.token;
    }
    // Try register
    const reg = await axios.post(`${API_URL}/auth/register`, { email: ADMIN_EMAIL, password: ADMIN_PASSWORD, fullName: 'Admin Pricing', role: 'admin' });
    return reg.data.token || reg.data.data?.token;
  } catch (e) {
    throw new Error('Failed to obtain admin token: ' + (e.response?.data?.error || e.message));
  }
}

function client(token) {
  const c = axios.create({ baseURL: API_URL, headers: { Authorization: `Bearer ${token}` } });
  return c;
}

async function testServices(c) {
  const code = 'TST-' + Math.random().toString(36).slice(2, 7).toUpperCase();
  const created = await c.post('/pricing/admin/services', { code, name: 'Test Service', defaultPrice: 10, currency: 'USD', active: true });
  const id = created.data.item._id;
  await c.patch(`/pricing/admin/services/${id}`, { active: false });
  const listed = await c.get('/pricing/admin/services');
  const found = listed.data.items.find(s => s._id === id);
  if (!found || found.active !== false) throw new Error('Service toggle failed');
  await c.delete(`/pricing/admin/services/${id}`);
}

async function testPricebooks(c) {
  const svcList = await c.get('/pricing/admin/services');
  const serviceId = svcList.data.items[0]?._id;
  const pb = await c.post('/pricing/admin/pricebooks', { region: 'ET', payerType: 'SelfPay', items: serviceId ? [{ serviceId, unitPrice: 9, taxRate: 0 }] : [] });
  const id = pb.data.item._id;
  await c.patch(`/pricing/admin/pricebooks/${id}`, { active: false });
  await c.patch(`/pricing/admin/pricebooks/${id}`, { items: serviceId ? [{ serviceId, unitPrice: 11, taxRate: 0 }] : [] });
  await c.delete(`/pricing/admin/pricebooks/${id}`);
}

async function testPlans(c) {
  const plan = await c.post('/pricing/admin/plans', { name: 'Basic', price: 5, interval: 'month', currency: 'USD', description: 'Test' });
  const id = plan.data.item._id;
  await c.patch(`/pricing/admin/plans/${id}`, { active: false, price: 6 });
  await c.delete(`/pricing/admin/plans/${id}`);
}

(async () => {
  try {
    const token = await ensureAdminToken();
    const c = client(token);
    await testServices(c);
    await testPricebooks(c);
    await testPlans(c);
    console.log('Admin pricing endpoints OK');
  } catch (e) {
    console.error('Admin pricing endpoints test failed:', e.response?.data || e.message);
    process.exit(1);
  }
})();
