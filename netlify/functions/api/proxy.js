// Generic proxy for /api/* routes. Forwards request to API_BACKEND_URL when set.
exports.handler = async function (event, context) {
  const backend = process.env.API_BACKEND_URL;
  if (!backend) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'No backend configured (API_BACKEND_URL)' })
    };
  }

  try {
    // Reconstruct target path
    const suffix = event.path.replace('/.netlify/functions/api/proxy', '') || '/';
    const url = new URL(suffix, backend);
    url.search = event.rawQueryString || '';

    const res = await fetch(url.toString(), {
      method: event.httpMethod,
      headers: filterHeaders(event.headers),
      body: event.body
    });
    const text = await res.text();
    return { statusCode: res.status, body: text };
  } catch (err) {
    return { statusCode: 502, body: JSON.stringify({ error: 'proxy error', details: String(err) }) };
  }
};

function filterHeaders(headers) {
  const out = {};
  if (!headers) return out;
  const pass = ['accept', 'content-type', 'authorization', 'cookie'];
  for (const k of Object.keys(headers)) {
    const lower = k.toLowerCase();
    if (pass.includes(lower)) out[lower] = headers[k];
  }
  return out;
}
