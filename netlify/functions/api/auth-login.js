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

    // Prefer Supabase Auth token endpoint if configured
    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY;
    if (SUPABASE_URL && SUPABASE_ANON_KEY) {
      const body = JSON.parse(payload || '{}');
      const url = `${SUPABASE_URL}/auth/v1/token?grant_type=password`;
      const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded', apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` }, body: `username=${encodeURIComponent(body.email || '')}&password=${encodeURIComponent(body.password || '')}` });
      const text = await res.text();
      return { statusCode: res.status, body: text };
    }

    // Supabase table lookup fallback
    const { supabaseSelect } = await import('./supabase.js');
    const body = JSON.parse(payload || '{}');
    const email = body.email;
    if (email) {
      const r = await supabaseSelect('users', `?select=id,email,password&email=eq.${encodeURIComponent(email)}`);
      if (r.status === 200 && r.body && r.body.length) {
        return { statusCode: 200, body: JSON.stringify({ token: 'supabase-mock-token', user: r.body[0] }) };
      }
    }
    return { statusCode: 401, body: JSON.stringify({ error: 'invalid credentials (mock)' }) };
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
