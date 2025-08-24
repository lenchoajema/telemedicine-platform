// backend/scripts/test-i18n-amharic.js
// Usage: node backend/scripts/test-i18n-amharic.js (server must be running)
// Verifies Amharic (am, am-ET) resource retrieval for common & admin namespaces.

import fetch from 'node-fetch';

async function run() {
  const base = process.env.I18N_TEST_BASE_URL || 'http://localhost:5000';
  const locales = ['am-ET','am'];
  for (const loc of locales) {
    const url = `${base}/api/i18n/resources?locale=${encodeURIComponent(loc)}&ns[]=common&ns[]=admin`;
    const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
    const etag = res.headers.get('etag');
    console.log('\nLocale:', loc, 'Status:', res.status, 'ETag:', etag);
    const json = await res.json();
    const data = json.data || json; // format depends on route options
    const sampleHome = data?.common?.nav?.home || data?.common?.['nav.home'];
    const sampleAdminTitle = data?.admin?.appointments?.title || data?.admin?.['appointments.title'];
    console.log(' nav.home =>', sampleHome);
    console.log(' admin.appointments.title =>', sampleAdminTitle);
  }
}

run().catch(e => { console.log(e); process.exit(1); });
