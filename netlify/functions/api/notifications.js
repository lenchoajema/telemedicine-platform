exports.handler = async function (event, context) {
  const backend = process.env.API_BACKEND_URL;
  try {
    if (backend) {
      const url = new URL('/api/notifications' + (event.path.replace('/.netlify/functions/api/notifications', '') || ''), backend);
      url.search = event.rawQueryString || '';
      const res = await fetch(url.toString(), { method: event.httpMethod, headers: filterHeaders(event.headers), body: event.body });
      const text = await res.text();
      return { statusCode: res.status, body: text };
    }
    return { statusCode: 200, body: JSON.stringify([]) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: 'notifications failed', details: String(err) }) };
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
