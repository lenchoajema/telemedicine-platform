Usage: helper scripts for deploying to Supabase + Upstash + Netlify

1. Set Netlify environment variables

   - Ensure Netlify CLI is installed and you are logged in: `netlify login`
   - Run (PowerShell):
     .\set-netlify-env.ps1
   - The script will prompt for values if not present in environment variables.

2. Run Supabase migrations

   - Ensure `psql` is installed and reachable in PATH.
   - Run:
     .\run-supabase-migrations.ps1
   - Provide a Postgres connection string when prompted.

3. Deploy frontend to Netlify
   - Ensure Netlify CLI is installed and you are logged in.
   - Run:
     .\netlify-deploy.ps1
   - Provide Netlify Site ID when prompted (or set NETLIFY_SITE_ID env var).

Notes:

- Do not commit any secrets to the repository.
- These scripts are small helpers and intentionally interactive for safety.
