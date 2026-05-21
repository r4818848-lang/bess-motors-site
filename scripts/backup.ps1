# BESS MOTORS — резервная копия (без node_modules и .next)
$ErrorActionPreference = "Stop"
$src = Split-Path $PSScriptRoot -Parent
$stamp = Get-Date -Format "yyyy-MM-dd_HHmm"
$dest = Join-Path (Split-Path $src -Parent) "BESS-MOTORS-backup_$stamp.zip"
$temp = Join-Path $env:TEMP "bess-motors-backup-$stamp"

if (Test-Path $temp) { Remove-Item $temp -Recurse -Force }
New-Item -ItemType Directory -Path $temp -Force | Out-Null

$exclude = @("node_modules", ".next")
Get-ChildItem $src -Force | Where-Object { $exclude -notcontains $_.Name } | ForEach-Object {
  Copy-Item $_.FullName -Destination (Join-Path $temp $_.Name) -Recurse -Force
}

if (Test-Path $dest) { Remove-Item $dest -Force }
Compress-Archive -Path "$temp\*" -DestinationPath $dest -CompressionLevel Optimal
Remove-Item $temp -Recurse -Force

Write-Host "OK: $dest"
Write-Host "Size MB:" ([math]::Round((Get-Item $dest).Length / 1MB, 2))
