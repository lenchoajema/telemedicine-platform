exports.handler = async function (event, context) {
  const info = {
    message: 'Hello from Netlify Functions (monorepo test)',
    env: { API_BACKEND_URL: !!process.env.API_BACKEND_URL, SUPABASE_URL: !!process.env.SUPABASE_URL }
  };
  return { statusCode: 200, body: JSON.stringify(info) };
}
