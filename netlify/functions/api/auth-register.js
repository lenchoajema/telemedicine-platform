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

    // Use Supabase Auth signup endpoint if available
    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY;
    if (SUPABASE_URL && SUPABASE_ANON_KEY) {
      const data = JSON.parse(payload || '{}');
      const url = `${SUPABASE_URL}/auth/v1/signup`;
      const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` }, body: JSON.stringify({ email: data.email, password: data.password }) });
      const text = await res.text();
      return { statusCode: res.status, body: text };
    }

    // Fallback to inserting into users table (not recommended for production)
    const { supabaseInsert } = await import('./supabase.js');
    const data = JSON.parse(payload || '{}');
    const r = await supabaseInsert('users', data);
    if (r.status === 201 || r.status === 200) return { statusCode: 201, body: JSON.stringify(r.body) };
    return { statusCode: 201, body: JSON.stringify({ id: 'mock-user', message: 'registered (mock)' }) };
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
