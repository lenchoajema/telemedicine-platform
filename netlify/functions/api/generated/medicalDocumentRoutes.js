exports.handler = async function (event, context) {
  const backend = process.env.API_BACKEND_URL;
  if (!backend) {
    return { statusCode: 501, body: JSON.stringify({ error: 'Not implemented in serverless fallback', route: '/api/medicalDocumentRoutes' }) };
  }
  try {
    const suffix = event.path.replace('/.netlify/functions/api/generated/medicalDocumentRoutes', '') || '/';
    const url = new URL('/api/medicalDocumentRoutes' + suffix, backend);
    url.search = event.rawQueryString || '';
    const res = await fetch(url.toString(), { method: event.httpMethod, headers: event.headers, body: event.body });
    const text = await res.text();
    return { statusCode: res.status, body: text };
  } catch (err) {
    return { statusCode: 502, body: JSON.stringify({ error: 'proxy error', details: String(err) }) };
  }
};
