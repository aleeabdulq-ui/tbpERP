# TBP ERP — one-click Windows setup (PowerShell)
# Right-click → "Run with PowerShell", or run from a VS Code terminal:
#     powershell -ExecutionPolicy Bypass -File scripts\setup-windows.ps1
$ErrorActionPreference = "Stop"
Set-Location (Split-Path $PSScriptRoot -Parent)

function Info($m)  { Write-Host "▶ $m" -ForegroundColor Cyan }
function Ok($m)    { Write-Host "✅ $m" -ForegroundColor Green }
function Fail($m)  { Write-Host "❌ $m" -ForegroundColor Red; Read-Host "Press Enter to exit"; exit 1 }

Info "Checking prerequisites…"
if (-not (Get-Command node -ErrorAction SilentlyContinue))   { Fail "Node.js not found. Install Node 22 LTS from https://nodejs.org, then re-run this script." }
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) { Fail "Docker Desktop not found. Install it from https://www.docker.com/products/docker-desktop and start it, then re-run." }
Ok "node $(node --version) + Docker found"

if (-not (Get-Command pnpm -ErrorAction SilentlyContinue)) {
  Info "Installing pnpm…"
  npm install -g pnpm@9 | Out-Null
}

Info "Starting MySQL container (first run downloads the image — be patient)…"
docker compose up -d mysql
if ($LASTEXITCODE -ne 0) { Fail "MySQL container failed to start. Is port 3306 already in use by another MySQL?" }

Info "Waiting for MySQL to become healthy…"
$ready = $false
foreach ($i in 1..45) {
  $cid = (docker compose ps -q mysql)
  if ($cid) {
    $status = (docker inspect --format='{{.State.Health.Status}}' $cid)
    if ($status -eq "healthy") { $ready = $true; break }
  }
  Start-Sleep -Seconds 2
}
if (-not $ready) { Fail "MySQL did not become healthy in time. Run: docker compose logs mysql" }
Ok "MySQL is healthy"

if (-not (Test-Path .env)) {
  Info "Creating .env with fresh random secrets…"
  Copy-Item .env.example .env
  $s1 = node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
  $s2 = node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
  (Get-Content .env) -replace [regex]::Escape("change-me-to-a-random-32-char-minimum-string"), $s1 `
                     -replace [regex]::Escape("change-me-to-a-different-random-32-char-string"), $s2 | Set-Content .env
  Ok ".env created"
}

Info "Installing dependencies…"
pnpm install
Info "Generating Prisma client…"
pnpm db:generate
Info "Applying database migrations…"
pnpm db:migrate
Info "Seeding demo data…"
pnpm db:seed

Ok "Setup complete!"
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
Write-Host "  Starting the app at http://localhost:5173" -ForegroundColor Yellow
Write-Host "  Sign in:  admin@tbp.ng  /  Password123!" -ForegroundColor Yellow
Write-Host "  (Stop anytime with Ctrl+C. Next time just run: pnpm dev)" -ForegroundColor DarkGray
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
pnpm dev
