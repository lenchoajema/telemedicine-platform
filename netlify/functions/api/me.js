exports.handler = async function (event, context) {
  const backend = process.env.API_BACKEND_URL;
  try {
    if (backend) {
      const target = new URL('/api/auth/me', backend).toString();
      const res = await fetch(target, { method: event.httpMethod, headers: filterHeaders(event.headers) });
      const text = await res.text();
      return { statusCode: res.status, body: text };
    }
    return { statusCode: 200, body: JSON.stringify({ id: 'mock-user', email: 'user@example.com' }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: 'me failed', details: String(err) }) };
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
