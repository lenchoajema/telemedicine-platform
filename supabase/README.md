Supabase migration files for telemedicine-platform

How to run locally with psql (or via Supabase SQL editor):

1. Connect to your Supabase Postgres database (get credentials from the Supabase project settings).
2. Run migrations in order:

psql "postgresql://<user>:<pass>@<host>:<port>/<db>" -f supabase/migrations/001_create_extensions_and_tables.sql

3. Seed basic data:

psql "postgresql://<user>:<pass>@<host>:<port>/<db>" -f supabase/seeds/seed_basic.sql

Notes:

- These migrations are intentionally minimal and intended for local testing and quick demos.
- For production, adapt password handling to use bcrypt or Supabase Auth instead of storing plain text.
