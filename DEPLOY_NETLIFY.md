# Deploying this monorepo to Netlify

This guide shows how to deploy the frontend in this monorepo to Netlify and test a sample serverless function.

Prereqs
- Netlify account (free tier) and GitHub connected
- Netlify CLI (optional, for local testing): `npm i -g netlify-cli`
- Confirm which package in the monorepo is the frontend (default in this repo: `frontend/`)

1) Verify the frontend build locally

```powershell
# from repo root
npm ci --prefix frontend
npm run build --prefix frontend

# verify a build folder exists
Get-ChildItem -Path frontend\build
```

2) Test the sample Netlify Function locally (optional)

```powershell
npm i -g netlify-cli
netlify dev

# The function will be available at http://localhost:8888/.netlify/functions/hello
```

3) Create site on Netlify (Web UI)
- In Netlify, choose "New site from Git" → select Git provider → select this repository.
- Set "Base directory" to the frontend folder (e.g., `frontend`).
- Build command: `npm ci --prefix frontend && npm run build --prefix frontend`
- Publish directory: `frontend/build`
- Add environment variables in Site settings > Build & deploy > Environment variables (use keys from `.env.example`).

4) Deploy via Netlify CLI (optional)

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
