const http = require('http');

function reqJSON({ host = 'localhost', port = 5000, path, method = 'GET', data = null, headers = {}, timeout = 8000 }) {
  return new Promise((resolve) => {
    const body = data ? JSON.stringify(data) : null;
    const options = {
      hostname: host,
      port,
      path,
      method,
      timeout,
      headers: {
        'Content-Type': 'application/json',
        ...(body ? { 'Content-Length': Buffer.byteLength(body) } : {}),
        ...headers,
      },
    };
    const req = http.request(options, (res) => {
      let raw = '';
      res.on('data', (chunk) => (raw += chunk));
      res.on('end', () => {
        const text = raw.toString();
        let json = null;
        try { json = JSON.parse(text || '{}'); } catch { /* ignore */ }
        resolve({ status: res.statusCode, ok: res.statusCode >= 200 && res.statusCode < 300, json, text });
      });
    });
    req.on('error', (err) => resolve({ ok: false, error: err.message, status: 0 }));
    req.on('timeout', () => { req.destroy(); resolve({ ok: false, error: 'timeout', status: 0 }); });
    if (body) req.write(body);
    req.end();
  });
}

function log(ok, name, extra = '') {
  if (ok) console.log(`✅ ${name} ${extra}`);
  else console.log(`❌ ${name} ${extra}`);
}

(async () => {
  console.log('🧪 Pharmacy Portal Minimal Endpoint Test');
  const email = `pharmtest.${Date.now()}@example.com`;
  const password = 'Password123!';

  // 1) Register pharmacist user
  const reg = await reqJSON({ path: '/api/auth/register', method: 'POST', data: { email, password, role: 'pharmacist', profile: { firstName: 'Pharm', lastName: 'Tester' } } });
  log(reg.ok, 'Register pharmacist user', `status=${reg.status}`);
  if (!reg.ok) return process.exit(1);

  const token = reg.json?.data?.token;
  const auth = { Authorization: `Bearer ${token}` };

  // 2) Role-boundary check: attempt lab portal (should be 403)
  const labMe = await reqJSON({ path: '/api/laboratory/me', headers: auth });
  log(labMe.status === 403, 'Role boundary block (pharmacist hitting lab portal)', `status=${labMe.status}`);

  // 3) Register pharmacy profile
  const pharmBody = { name: `Test Pharmacy ${Date.now()}`, address: '100 Main', city: 'Pharmville', state: 'PV', country: 'US', phone: '+1-555-0200' };
  const pReg = await reqJSON({ path: '/api/pharmacy/register', method: 'POST', data: pharmBody, headers: auth });
  log(pReg.ok, 'Register pharmacy profile', `status=${pReg.status}`);
  if (!pReg.ok) return process.exit(1);

  // 4) Inventory upsert
  const inv = await reqJSON({ path: '/api/pharmacy/inventory', method: 'POST', data: { drugId: 'AMOX500', batchNumber: 'B1', price: 4.99, qtyOnHand: 25, visibility: 'Public' }, headers: auth });
  log(inv.ok, 'Upsert inventory item', `status=${inv.status}`);

  // 5) List inventory with pagination
  const invList = await reqJSON({ path: '/api/pharmacy/inventory?page=1&pageSize=10&sort=-updatedAt', headers: auth });
  const hasMeta = invList.json && typeof invList.json.page === 'number' && typeof invList.json.pageSize === 'number';
  log(invList.ok && hasMeta, 'List inventory (with pagination meta)', `status=${invList.status}`);

  // 6) Orders list (may be empty)
  const orders = await reqJSON({ path: '/api/pharmacy/orders?page=1&pageSize=5', headers: auth });
  log(orders.ok, 'List pharmacy orders', `status=${orders.status}`);

  // 7) Public discovery pharmacies
  const pubs = await reqJSON({ path: '/api/discovery/pharmacies?page=1' });
  log(pubs.ok, 'Public discovery pharmacies', `status=${pubs.status}`);

  console.log('🏁 Done');
  process.exit(0);
})();
