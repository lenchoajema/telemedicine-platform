// Minimal Supabase + Upstash helper using REST API and fetch — avoids adding deps.
const fetchJson = async (url, opts = {}) => {
  const res = await fetch(url, opts);
  const text = await res.text();
  try {
    return { status: res.status, body: JSON.parse(text) };
  } catch (e) {
    return { status: res.status, body: text };
  }
};

async function supabaseSelect(table, query = '') {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_KEY;
  if (!SUPABASE_URL || !SUPABASE_KEY) return { status: 400, body: { error: 'Supabase not configured' } };
  const url = `${SUPABASE_URL}/rest/v1/${table}${query}`;
  return await fetchJson(url, { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, Accept: 'application/json' } });
}

async function supabaseInsert(table, payload) {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_KEY;
  if (!SUPABASE_URL || !SUPABASE_KEY) return { status: 400, body: { error: 'Supabase not configured' } };
  const url = `${SUPABASE_URL}/rest/v1/${table}`;
  return await fetchJson(url, { method: 'POST', headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(payload) });
}

async function upstashPublish(topic, message) {
  // accept either UPSTASH_REST_URL / UPSTASH_REST_TOKEN or UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN
  const UPSTASH_URL = process.env.UPSTASH_REST_URL || process.env.UPSTASH_REDIS_REST_URL;
  const UPSTASH_TOKEN = process.env.UPSTASH_REST_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!UPSTASH_URL || !UPSTASH_TOKEN) return { status: 400, body: { error: 'Upstash not configured' } };
  const url = `${UPSTASH_URL}/pubsub/publish/${encodeURIComponent(topic)}`;
  return await fetchJson(url, { method: 'POST', headers: { Authorization: `Bearer ${UPSTASH_TOKEN}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ message }) });
}

module.exports = { supabaseSelect, supabaseInsert, upstashPublish };
