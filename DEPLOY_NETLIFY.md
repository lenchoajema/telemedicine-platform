# Deploying this monorepo to Netlify

This guide shows how to deploy the frontend in this monorepo to Netlify and test a sample serverless function.

Prereqs

- Netlify account (free tier) and GitHub connected
- Netlify CLI (optional, for local testing): `npm i -g netlify-cli`
- Confirm which package in the monorepo is the frontend (default in this repo: `frontend/`)

1. Verify the frontend build locally

```powershell
# from repo root
npm ci --prefix frontend
npm run build --prefix frontend

# verify a build folder exists
Get-ChildItem -Path frontend\build
```

2. Test the sample Netlify Function locally (optional)

```powershell
npm i -g netlify-cli
netlify dev

# The function will be available at http://localhost:8888/.netlify/functions/hello
```

3. Create site on Netlify (Web UI)

- In Netlify, choose "New site from Git" → select Git provider → select this repository.
- Set "Base directory" to the frontend folder (e.g., `frontend`).
- Build command: `npm ci --prefix frontend && npm run build --prefix frontend`
- Publish directory: `frontend/build`
- Add environment variables in Site settings > Build & deploy > Environment variables (use keys from `.env.example`).

4. Deploy via Netlify CLI (optional)

```powershell
# login once
netlify login

# initialize or link to existing site
netlify init

# one-time preview deploy
netlify deploy --dir=frontend\build

# production deploy
netlify deploy --dir=frontend\build --prod
```

Notes

- If your frontend is in a different folder, update `netlify.toml` and the commands above.
- Netlify Functions are short-lived; for realtime or WebSockets, use Supabase Realtime or a VM host.

Environment variables to set on Netlify (copy these names into Site → Settings → Build & deploy → Environment):

- API_BACKEND_URL — Optional: full backend URL to proxy requests to (e.g., https://api.example.com). If empty, functions return mock responses.
- SUPABASE_URL — If you use Supabase for DB/auth.
- SUPABASE_ANON_KEY — Public anon key for client usage.
- UPSTASH_REDIS_REST_URL — Upstash REST URL for Redis (if used).
- UPSTASH_REDIS_REST_TOKEN — Upstash REST token.
- JWT_SECRET — If serverless functions sign or verify JWTs (avoid exposing in client-side code).
- SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD — If functions send email.
- NODE_ENV — set to production

Set secrets in Netlify UI and do not commit them to the repo.

Connect Netlify to the `netlify-deploy` branch (Git-based deploys)

1. In Netlify UI, create a new site and choose "Import from Git".
2. Select your repository and when prompted for branch, choose `netlify-deploy`.
3. Set Base directory to `frontend` and confirm build settings match `netlify.toml`.
4. Add the environment variables listed above in Site Settings → Build & deploy → Environment.
5. Save and trigger a deploy by pushing to `netlify-deploy` or clicking "Trigger deploy".

Notes on using Render + MongoDB free alternatives for backend

- Render: provides free web services (with sleeping) for hobby projects and supports persistent Node processes including WebSockets. New accounts may require a payment method for some features; free services may sleep after inactivity. Render makes it easy to deploy a full backend (Express) without converting to serverless.

- MongoDB: You can use MongoDB Atlas free tier for a hosted MongoDB cluster (shared M0 tier). Atlas allows connecting from Render or other hosts. Atlas typically does not require a credit card for the free tier signup, but provider policies can change.

Tradeoffs if you choose Render + MongoDB:

- Pros:

  - Keeps your existing backend mostly unchanged (no massive refactor to serverless).
  - Supports WebSockets and background workers.
  - Quick to get running behind a single custom domain.

- Cons:
  - Resource limits on free tier (sleeping services, limited connections, limited storage).
  - You still need to manage DB backups and scaling.
  - For production-grade availability, you’ll need paid plans.

Recommendation:

- If you want the fastest path with minimal refactor: deploy backend on Render (or a similar VM host) and use MongoDB Atlas for DB; keep frontend on Netlify. Use `API_BACKEND_URL` in Netlify to point the frontend to the Render service.
- If you want to minimize server management and stay fully on free-tier serverless: keep frontend on Netlify, move auth and data to Supabase, and use Upstash for Redis-like needs — but this requires refactoring real-time/socket features.
