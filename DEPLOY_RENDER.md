# Deploy backend to Render (Docker)

This guide explains how to deploy the `backend/` service to Render using the included `render.yaml` and `backend/Dockerfile`.

Prereqs

- Render account (free tier)
- GitHub repo connected to Render
- MongoDB Atlas (or other MongoDB) connection URI

1. Prepare environment variables (in Render dashboard)

- MONGO_URI - MongoDB connection string
- JWT_SECRET - JWT secret
- SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD (if sending email)
- API specific envs from `backend/.env.example`

2. Connect repo and create service

- In Render dashboard: New -> Web Service -> Connect GitHub repo
- Select branch: `netlify-deploy` (or main)
- Choose "Docker" as environment and point to `backend/Dockerfile` (or use `render.yaml`)

3. Set Protected Environment variables

- In service settings -> Environment -> Add the env vars above (mark as "Protected")

4. Deploy

- Render will build the Docker image and deploy the service. Logs are available in the dashboard.

Notes

- Render free services may sleep after inactivity.
- For production, consider a paid plan and automatic backups for MongoDB.
