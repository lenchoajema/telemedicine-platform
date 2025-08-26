# Netlify Environment Template

Copy these into Netlify Site → Settings → Build & deploy → Environment variables.

Required variables for this repository:

SUPABASE_URL=
SUPABASE_KEY=
SUPABASE_ANON_KEY=

# Upstash: we accept either of these name pairs

UPSTASH_REST_URL= # preferred
UPSTASH_REST_TOKEN= # preferred
UPSTASH_REDIS_REST_URL= # alternate name found in some dashboards
UPSTASH_REDIS_REST_TOKEN= # alternate name
NODE_ENV=production
API_BACKEND_URL=
NODE_ENV=production
API_BACKEND_URL=

Notes:

- `SUPABASE_URL` should be the REST endpoint (e.g. https://xyz.supabase.co)
- `SUPABASE_KEY` is the service role key used by server functions (keep secret)
- `SUPABASE_ANON_KEY` is the anon/public key used by the frontend
- `UPSTASH_REST_URL` and `UPSTASH_REST_TOKEN` are provided by Upstash for pub/sub
- `API_BACKEND_URL` is optional when using Netlify functions as a proxy — set to your backend hosted URL (e.g., on Supabase Edge Functions or a separate host)

Set these in Netlify site settings, not in the repository. For local development, put them in a `.env` in the project root (do not commit secrets).
