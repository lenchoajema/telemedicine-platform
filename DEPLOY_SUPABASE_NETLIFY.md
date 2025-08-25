# Deploying with Supabase + Upstash + Netlify (no credit card required)

This guide walks through deploying the frontend to Netlify and using Supabase (Postgres + Auth + Storage) and Upstash (pub/sub) for serverless fallbacks.

1) Prepare Supabase
- Create a Supabase project (free tier) at https://app.supabase.com
- In the Supabase dashboard: create tables `users`, `appointments`, `messages`, `notifications`, `doctors` with minimal columns used by your app (id, email, password, created_at ...)
- Copy the `SUPABASE_URL` and `SUPABASE_ANON_KEY` (for client) and `service_role` key (for server-side operations).

2) Prepare Upstash (optional for pub/sub)
- Create a free Upstash account and a Redis database
- Note the `REST URL` and `REST TOKEN` from the Upstash dashboard

3) Netlify site config
- Create a Netlify site from Git and connect this repo
- Base directory: `frontend`
- Build command: `npm ci --prefix frontend && npm run build --prefix frontend`
- Publish directory: `frontend/build`
- Functions directory: `netlify/functions`

4) Environment variables (Netlify Site settings → Build & deploy → Environment)
- SUPABASE_URL = https://your-project.supabase.co
- SUPABASE_KEY = <service_role_key>   # keep secret
- SUPABASE_ANON_KEY = <anon_key>
- UPSTASH_REST_URL = <upstash-rest-url>
- UPSTASH_REST_TOKEN = <upstash-rest-token>
- NODE_ENV = production
- API_BACKEND_URL = (leave empty to use Supabase/Upstash fallback)

5) Deploy and test
- Push to the branch Netlify is connected to (e.g., `netlify-deploy`) and watch builds
- Test the endpoints:
  - `/.netlify/functions/api/health`
  - `/.netlify/functions/api/discovery`
  - `/.netlify/functions/api/auth-register` (POST)
  - `/.netlify/functions/api/auth-login` (POST)

Notes
- This approach uses Supabase for persistent data and Upstash for pub/sub; real-time WebRTC TURN servers are still out of scope and require a paid provider for production-quality calls.
