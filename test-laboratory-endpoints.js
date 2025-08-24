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
        'Content-Length': body ? Buffer.byteLength(body) : 0,
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
  console.log('🧪 Laboratory Portal Minimal Endpoint Test');
  const email = `labtest.${Date.now()}@example.com`;
  const password = 'Password123!';

  // 1) Register lab user
  const reg = await reqJSON({ path: '/api/auth/register', method: 'POST', data: { email, password, role: 'laboratory', profile: { firstName: 'Lab', lastName: 'Tester' } } });
  log(reg.ok, 'Register laboratory user', `status=${reg.status}`);
  if (!reg.ok) return process.exit(1);

  const token = reg.json?.data?.token;
  if (!token) { console.log('❌ No token returned from register'); return process.exit(1); }
  const auth = { Authorization: `Bearer ${token}` };

  // 2) Register laboratory profile
  const labBody = { name: `Test Lab ${Date.now()}`, address: '1 Test Way', city: 'Testville', state: 'TS', country: 'US', phone: '+1-555-0100' };
  const labReg = await reqJSON({ path: '/api/laboratory/register', method: 'POST', data: labBody, headers: auth });
  log(labReg.ok, 'Register laboratory profile', `status=${labReg.status}`);
  if (!labReg.ok) return process.exit(1);

  // 3) Upsert catalog item
  const catItem = { testCode: 'CBC', testName: 'Complete Blood Count', price: 15.5, currency: 'USD', tatHours: 24, isActive: true };
  const upsert = await reqJSON({ path: '/api/laboratory/catalog', method: 'POST', data: catItem, headers: auth });
  log(upsert.ok, 'Upsert catalog item', `status=${upsert.status}`);

  // 4) List catalog with pagination
  const list = await reqJSON({ path: '/api/laboratory/catalog?page=1&pageSize=10&sort=testCode', headers: auth });
  const hasMeta = list.json && typeof list.json.page === 'number' && typeof list.json.pageSize === 'number';
  log(list.ok && hasMeta, 'List catalog (with pagination meta)', `status=${list.status}`);

  // 5) List lab orders (should succeed, may be empty)
  const orders = await reqJSON({ path: '/api/laboratory/orders?page=1&pageSize=5', headers: auth });
  log(orders.ok, 'List lab orders', `status=${orders.status}`);

  // 6) Public labs discovery
  const labsPublic = await reqJSON({ path: '/api/discovery/labs?page=1' });
  log(labsPublic.ok, 'Public labs discovery', `status=${labsPublic.status}`);

  console.log('🏁 Done');
  process.exit(0);
})();
 
// Additional role-boundary test: pharmacist should not access lab portal
;(async () => {
  const email = `pharmforlab.${Date.now()}@example.com`;
  const password = 'Password123!';
  const reg = await reqJSON({ path: '/api/auth/register', method: 'POST', data: { email, password, role: 'pharmacist', profile: { firstName: 'Pharm', lastName: 'NoLab' } } });
  if (!reg.ok) return;
  const token = reg.json?.data?.token;
  const auth = { Authorization: `Bearer ${token}` };
  const labMe = await reqJSON({ path: '/api/laboratory/me', headers: auth });
  log(labMe.status === 403, 'Role boundary: pharmacist blocked from lab portal', `status=${labMe.status}`);
})();
