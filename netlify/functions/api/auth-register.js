exports.handler = async function (event, context) {
  const backend = process.env.API_BACKEND_URL;
  try {
    const payload = event.body;
    if (backend) {
      const target = new URL('/api/auth/register', backend).toString();
      const res = await fetch(target, { method: 'POST', headers: filterHeaders(event.headers), body: payload });
      const text = await res.text();
      return { statusCode: res.status, body: text };
    }

    // Mock register: echo back user info
    return {
      statusCode: 201,
      body: JSON.stringify({ id: 'mock-user', message: 'registered (mock)' })
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: 'register failed', details: String(err) }) };
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
