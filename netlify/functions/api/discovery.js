exports.handler = async function (event, context) {
  const backend = process.env.API_BACKEND_URL;
  try {
    if (backend) {
      const url = new URL('/api/discovery', backend);
      // forward query string
      url.search = event.rawQueryString || '';
      const res = await fetch(url.toString(), { method: event.httpMethod, headers: filterHeaders(event.headers) });
      const text = await res.text();
      return { statusCode: res.status, body: text };
    }

    // Try Supabase fallback
    const { supabaseSelect } = await import('./supabase.js');
    const r = await supabaseSelect('doctors', '?select=id,name');
    if (r.status === 200) {
      return { statusCode: 200, body: JSON.stringify({ doctors: r.body }) };
    }
    // fallback mock
    const sample = {
      specialties: ['General Practice', 'Cardiology', 'Dermatology'],
      doctors: [{ id: 'doc1', name: 'Dr. Alice' }, { id: 'doc2', name: 'Dr. Bob' }]
    };
    return { statusCode: 200, body: JSON.stringify(sample) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: 'discovery failed', details: String(err) }) };
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
