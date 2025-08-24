exports.handler = async function (event, context) {
  const backend = process.env.API_BACKEND_URL;
  try {
    const payload = event.body;
    if (backend) {
      const target = new URL('/api/auth/login', backend).toString();
      const res = await fetch(target, { method: 'POST', headers: filterHeaders(event.headers), body: payload });
      const text = await res.text();
      return { statusCode: res.status, body: text };
    }

    // Mock login: accept any credentials and return fake token
    return {
      statusCode: 200,
      body: JSON.stringify({ token: 'mock-jwt-token', user: { id: 'mock-user', email: 'user@example.com' } })
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: 'login failed', details: String(err) }) };
  }
};

function filterHeaders(headers) {
  const out = {};
  if (!headers) return out;
  const pass = ['accept', 'content-type', 'authorization'];
  for (const k of Object.keys(headers)) {
    const lower = k.toLowerCase();
    if (pass.includes(lower)) out[lower] = headers[k];
  }
  return out;
}
