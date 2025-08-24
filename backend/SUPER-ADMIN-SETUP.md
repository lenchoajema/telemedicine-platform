# Super Admin Wiring

This backend uses a single super admin account, identified by `ROOT_ADMIN_EMAIL` (default: `admin@telemedicine.com`). The super admin can edit/update any user, including other admins.

What’s wired:

- Middleware: `authorizeSuperAdmin` checks email against `ROOT_ADMIN_EMAIL`.
- Routes: `PATCH /api/admin/users/super/:userId` is restricted to super admin.
- Controllers: Extra protections for admin/root users in update/delete/status; elevated edits (email/username/timeZone) when requester is super admin.
- Seeding: `src/scripts/seed-root-admin.js` creates/upgrades the root admin.

Quick setup

1. Configure backend/.env

```
ROOT_ADMIN_EMAIL=admin@telemedicine.com
SMTP_HOST=localhost
SMTP_PORT=2525
FROM_EMAIL=noreply@telemedicine.com
```

2. Seed/upgrade the root admin

```
cd backend
npm run seed:root-admin
```

Optional resets:

- Set `RESET_ROOT_ADMIN_PASSWORD=true` and rerun the script to force a new password (or set `ROOT_ADMIN_PASSWORD` first).

Manual smoke checks

- Login as ROOT_ADMIN_EMAIL and obtain a JWT.
- Call:
  - `PATCH /api/admin/users/super/:userId` with body fields like `{ email, username, timeZone, role, profile }`.
  - `PUT /api/admin/users/:userId/status` to change status.
  - `POST /api/admin/users/:userId/reset-password` to force reset.
  - `GET /api/admin/users/export/csv` and `POST /api/admin/users/import/csv` for CSV roundtrip.

Notes

- Email operations use SMTP settings; in dev, failures are caught and logged.
- Root admin protection prevents non-super admins from modifying the root admin or other admins.
