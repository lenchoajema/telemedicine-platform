const fs = require('fs');
const path = require('path');

const backendRoutesDir = path.join(__dirname, '..', 'backend', 'src', 'routes');
const outDir = path.join(__dirname, '..', 'netlify', 'functions', 'api', 'generated');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

const files = fs.readdirSync(backendRoutesDir).filter(f => f.endsWith('.js'));
for (const file of files) {
  const name = file.replace(/\.js$/, '');
  const fn = `exports.handler = async function (event, context) {\n  const backend = process.env.API_BACKEND_URL;\n  if (!backend) {\n    return { statusCode: 501, body: JSON.stringify({ error: 'Not implemented in serverless fallback', route: '/api/${name}' }) };\n  }\n  try {\n    const suffix = event.path.replace('/.netlify/functions/api/generated/${name}', '') || '/';\n    const url = new URL('/api/${name}' + suffix, backend);\n    url.search = event.rawQueryString || '';\n    const res = await fetch(url.toString(), { method: event.httpMethod, headers: event.headers, body: event.body });\n    const text = await res.text();\n    return { statusCode: res.status, body: text };\n  } catch (err) {\n    return { statusCode: 502, body: JSON.stringify({ error: 'proxy error', details: String(err) }) };\n  }\n};\n`;
  fs.writeFileSync(path.join(outDir, `${name}.js`), fn);
  console.log('wrote', name);
}

console.log('generated', files.length, 'wrappers');
