Deploying Telemedicine Platform to Supabase + Upstash + Netlify

Summary steps (concise):

1. Provision Supabase project and apply SQL migrations:

   - Install Supabase CLI: `npm i -g supabase`
   - Login and link: `supabase login` then `supabase link --project-ref <ref>`
   - Apply migrations: `psql "postgresql://<user>:<pass>@<host>:<port>/<db>" -f supabase/migrations/001_create_extensions_and_tables.sql`

2. Provision Upstash and copy REST credentials.

3. Create a Netlify site for this repo and set environment variables (see `netlify/ENVIRONMENT.md`).

4. Deploy:

   - Through Netlify web UI: push branch and trigger deploy.
   - Or locally via Netlify CLI:

     netlify login
     netlify init # link to site
     netlify deploy --prod

Notes:

- Netlify build command uses `npm ci --prefix frontend && npm run build --prefix frontend` and publishes `frontend/dist`.
- The `netlify/functions` folder contains server helper functions that require Supabase and Upstash env vars.
- For debugging functions locally, use `netlify dev` after setting environment variables in a `.env` file.
