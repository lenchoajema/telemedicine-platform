param(
  [string]$SiteId
)

if (-not $SiteId) { $SiteId = $env:NETLIFY_SITE_ID }
if (-not $SiteId) { $SiteId = Read-Host "Enter Netlify Site ID" }

Write-Host "Building frontend..."
npm ci --prefix frontend
npm run build --prefix frontend
if ($LASTEXITCODE -ne 0) { Write-Host "Build failed" -ForegroundColor Red; exit 1 }

Write-Host "Deploying to Netlify (production)..."
netlify deploy --prod --dir frontend/dist --site $SiteId
if ($LASTEXITCODE -ne 0) { Write-Host "Deploy failed" -ForegroundColor Red; exit 1 }

Write-Host "Deploy finished. Verify in Netlify web UI or open the site URL returned above."
