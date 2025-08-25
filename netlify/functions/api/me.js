exports.handler = async function (event, context) {
  const backend = process.env.API_BACKEND_URL;
  try {
    if (backend) {
      const target = new URL('/api/auth/me', backend).toString();
      const res = await fetch(target, { method: event.httpMethod, headers: filterHeaders(event.headers) });
      const text = await res.text();
      return { statusCode: res.status, body: text };
    }
    const { supabaseSelect } = await import('./supabase.js');
    // Try to find user by a header or query param (best-effort for demo)
    const auth = event.headers && (event.headers.authorization || event.headers.Authorization);
    if (auth) {
      // This is a simple demo: look up the user by id if token includes user id
      const maybeId = auth.replace('Bearer ', '').replace('supabase-mock-token-', '');
      const r = await supabaseSelect('users', `?select=id,email&id=eq.${encodeURIComponent(maybeId)}`);
      if (r.status === 200 && r.body && r.body.length) return { statusCode: 200, body: JSON.stringify(r.body[0]) };
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
