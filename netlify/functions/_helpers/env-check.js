exports.handler = async function () {
  const vars = ['SUPABASE_URL','SUPABASE_KEY','SUPABASE_ANON_KEY','UPSTASH_REST_URL','UPSTASH_REST_TOKEN','API_BACKEND_URL'];
  const present = {};
  for (const v of vars) present[v] = !!process.env[v];
  return { statusCode: 200, body: JSON.stringify(present, null, 2) };
};
