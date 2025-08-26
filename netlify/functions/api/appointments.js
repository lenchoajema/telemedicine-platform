exports.handler = async function (event, context) {
  const backend = process.env.API_BACKEND_URL;
  try {
    if (backend) {
      const url = new URL('/api/appointments' + (event.path.replace('/.netlify/functions/api/appointments', '') || ''), backend);
      url.search = event.rawQueryString || '';
      const res = await fetch(url.toString(), { method: event.httpMethod, headers: filterHeaders(event.headers), body: event.body });
      const text = await res.text();
      return { statusCode: res.status, body: text };
    }
  const { supabaseSelect } = await import('./supabase.js');
  const r = await supabaseSelect('appointments', '?select=*&order=start_time.desc');
  if (r.status === 200) return { statusCode: 200, body: JSON.stringify(r.body) };
  // Mock appointments list
  return { statusCode: 200, body: JSON.stringify([{ id: 'a1', time: '2025-08-24T10:00:00Z' }]) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: 'appointments failed', details: String(err) }) };
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
