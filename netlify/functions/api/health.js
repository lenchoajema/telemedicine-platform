exports.handler = async function (event, context) {
  const backend = process.env.API_BACKEND_URL;
  try {
    if (backend) {
      const target = new URL('/api/health', backend).toString();
      const res = await fetch(target, { method: event.httpMethod, headers: filterHeaders(event.headers) });
      const text = await res.text();
      return { statusCode: res.status, body: text };
    }

    // Try Supabase simple check
    const { supabaseSelect } = await import('./supabase.js');
    const r = await supabaseSelect('users', '?select=id&limit=1');
    if (r.status === 200) {
      return { statusCode: 200, body: JSON.stringify({ status: 'ok', source: 'supabase' }) };
    }
    // Mock response if no backend configured
    return {
      statusCode: 200,
      body: JSON.stringify({ status: 'ok', source: 'mock' })
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: 'health check failed', details: String(err) }) };
  }
};

function filterHeaders(headers) {
  const out = {};
  if (!headers) return out;
  // copy only a safe set
  const pass = ['accept', 'content-type', 'authorization'];
  for (const k of Object.keys(headers)) {
    const lower = k.toLowerCase();
    if (pass.includes(lower)) out[lower] = headers[k];
  }
  return out;
}
