Deployment checklist: Supabase + Upstash + Netlify

1. Provision Supabase project

   - Create a Supabase project at https://app.supabase.com
   - In the SQL editor, run the migrations in `supabase/migrations/*.sql` to create tables and extensions.
   - From Project Settings → API copy the `URL` (use as SUPABASE_URL) and create a `service_role` key (use as SUPABASE_KEY). Also copy anon/public key (SUPABASE_ANON_KEY).
   - Optional: Set up Row Level Security policies as needed for your app.

2. Provision Upstash (Redis Pub/Sub)

   - Create an Upstash account and create a Redis instance.
   - In Upstash console, go to REST credentials and copy `REST URL` and `REST Token`.
   - Use those values for UPSTASH_REST_URL and UPSTASH_REST_TOKEN.

3. Prepare backend (if using separate backend)

   - If you plan to host the backend elsewhere (not Netlify functions), deploy it (Heroku, Render, Supabase Edge, or similar) and set `API_BACKEND_URL` to its base URL.

4. Configure Netlify

   - Connect repository and pick branch (e.g., `netlify-deploy` or `main`).
   - In Site Settings → Build & deploy → Environment, add variables from step 1 and 2.
   - Build command: `npm ci --prefix frontend && npm run build --prefix frontend`
   - Publish directory: `frontend/build` (or `frontend/dist` if you use Vite output — verify `frontend/package.json` build output)

5. Functions and Proxy

   - The Netlify functions in `netlify/functions/api` expect SUPABASE*\* and UPSTASH*\* env vars.
   - A proxy function exists at `/.netlify/functions/api/proxy` that forwards `/api/*` calls to `API_BACKEND_URL`. You can set `API_BACKEND_URL` to your backend or to Supabase Edge Functions.

6. Test after deploy
   - Visit the site and exercise login/appointments features.
   - Test the function endpoints via: `/.netlify/functions/api/health` and `/.netlify/functions/api/supabase`.

Troubleshooting

- If functions return "Supabase not configured" verify env names.
- If CORS issues occur, confirm SUPABASE settings and Netlify domain are allowed.

Security

- Never commit `SUPABASE_KEY` or `UPSTASH_REST_TOKEN` to the repo.
- Prefer storing secrets in Netlify environment variables.

Optional: Deploy backend as Supabase Edge Function

- Convert any express endpoints to Edge Function handlers and deploy with `supabase functions deploy`.
- Set `API_BACKEND_URL` to your Edge Function base URL.
