# Install deps, verify build, create backup
$ErrorActionPreference = "Stop"
$root = Split-Path $PSScriptRoot -Parent
Set-Location $root

Write-Host "=== BESS MOTORS: save project ===" -ForegroundColor Cyan

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  Write-Host "Install Node.js: https://nodejs.org" -ForegroundColor Red
  exit 1
}

Write-Host "npm install..."
npm install --no-fund --no-audit

Write-Host "build check..."
npm run build
if ($LASTEXITCODE -ne 0) {
  Write-Host "Build failed." -ForegroundColor Red
  exit 1
}

& "$PSScriptRoot\backup.ps1"
Write-Host ""
Write-Host "Done. Run ZAPUSK-SAJTA.bat to start the site." -ForegroundColor Green
