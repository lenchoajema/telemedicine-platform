param(
  [string]$SiteId
)

if (-not $SiteId) {
  $SiteId = $env:NETLIFY_SITE_ID
}

if (-not $SiteId) {
  $SiteId = Read-Host "Enter your Netlify Site ID (or set NETLIFY_SITE_ID)"
}

$vars = @(
  'SUPABASE_URL',
  'SUPABASE_KEY',
  'SUPABASE_ANON_KEY',
  'UPSTASH_REST_URL',
  'UPSTASH_REST_TOKEN',
  'API_BACKEND_URL'
)

Write-Host "Setting Netlify environment variables for site: $SiteId"

foreach ($k in $vars) {
  $current = Get-ChildItem env:$k -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Value -ErrorAction SilentlyContinue
  if ($current) {
    Write-Host "Using value from environment for $k"
    $value = $current
  } else {
    $value = Read-Host -Prompt "Enter value for $k (leave blank to skip)"
  }
  if ([string]::IsNullOrEmpty($value)) {
    Write-Host "Skipping $k"
    continue
  }

  Write-Host "Setting $k in Netlify (production context)"
  netlify env:set $k $value --site $SiteId --context production
  if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to set $k. Please ensure you are logged in with 'netlify login' and the site id is correct." -ForegroundColor Red
    exit 1
  }
}

Write-Host "All done. Verify values in Netlify UI or with 'netlify env:list --site $SiteId'"
