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
        try { json = JSON.parse(text || '{}'); } catch {}
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
  console.log(`${ok ? '✅' : '❌'} ${name} ${extra}`);
}

(async () => {
  console.log('🧪 Role Boundary Tests: Lab vs Pharmacy Portals');

  // Pharmacist user should be blocked from lab portal
  const pharmEmail = `rb.pharm.${Date.now()}@example.com`;
  const pwd = 'Password123!';
  const r1 = await reqJSON({ path: '/api/auth/register', method: 'POST', data: { email: pharmEmail, password: pwd, role: 'pharmacist', profile: { firstName: 'Pharm', lastName: 'RB' } } });
  const pharmToken = r1.json?.data?.token; const pharmAuth = { Authorization: `Bearer ${pharmToken}` };
  const labMe = await reqJSON({ path: '/api/laboratory/me', headers: pharmAuth });
  log(labMe.status === 403, 'Pharmacist cannot access lab portal', `status=${labMe.status}`);

  // Laboratory user should be blocked from pharmacy portal
  const labEmail = `rb.lab.${Date.now()}@example.com`;
  const r2 = await reqJSON({ path: '/api/auth/register', method: 'POST', data: { email: labEmail, password: pwd, role: 'laboratory', profile: { firstName: 'Lab', lastName: 'RB' } } });
  const labToken = r2.json?.data?.token; const labAuth = { Authorization: `Bearer ${labToken}` };
  const pharmMe = await reqJSON({ path: '/api/pharmacy/me', headers: labAuth });
  log(pharmMe.status === 403, 'Laboratory cannot access pharmacy portal', `status=${pharmMe.status}`);

  console.log('🏁 Done');
})();
