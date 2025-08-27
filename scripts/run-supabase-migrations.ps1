param(
  [string]$DbUrl
)

if (-not $DbUrl) {
  $DbUrl = Read-Host "Enter Postgres connection string (postgresql://user:pass@host:port/db)"
}

if (-not (Get-Command psql -ErrorAction SilentlyContinue)) {
  Write-Host "psql not found in PATH. Install Postgres client or use Supabase SQL editor." -ForegroundColor Yellow
  exit 1
}

Write-Host "Running migrations against: $DbUrl"

psql $DbUrl -f "supabase/migrations/001_create_extensions_and_tables.sql"
if ($LASTEXITCODE -ne 0) { Write-Host "Migration failed" -ForegroundColor Red; exit 1 }

if (Test-Path "supabase/seeds/seed_basic.sql") {
  Write-Host "Applying seed_basic.sql"
  psql $DbUrl -f "supabase/seeds/seed_basic.sql"
}

Write-Host "Migrations complete"
