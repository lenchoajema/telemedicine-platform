exports.handler = async function (event, context) {
  const backend = process.env.API_BACKEND_URL;
  try {
    if (backend) {
      const url = new URL('/api/messages' + (event.path.replace('/.netlify/functions/api/messages', '') || ''), backend);
      url.search = event.rawQueryString || '';
      const res = await fetch(url.toString(), { method: event.httpMethod, headers: filterHeaders(event.headers), body: event.body });
      const text = await res.text();
      return { statusCode: res.status, body: text };
    }
  const { supabaseSelect } = await import('./supabase.js');
  const r = await supabaseSelect('messages', '?select=id,text&order=created_at.desc');
  if (r.status === 200) return { statusCode: 200, body: JSON.stringify(r.body) };
  return { statusCode: 200, body: JSON.stringify([{ id: 'm1', text: 'hello' }]) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: 'messages failed', details: String(err) }) };
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
