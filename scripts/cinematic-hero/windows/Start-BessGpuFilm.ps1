# Real 1920x1080 Cycles frames of the three GLB cars on the owner's GPU.
# Default is a 2-second control (frames 42-89). The 12-second film stays off
# until that control has been watched and -Approved is passed.
#
# From the repo root, in PowerShell:
#   powershell -ExecutionPolicy Bypass -File scripts\cinematic-hero\windows\Start-BessGpuFilm.ps1
# After the control looks right:
#   powershell -ExecutionPolicy Bypass -File scripts\cinematic-hero\windows\Start-BessGpuFilm.ps1 -Mode Film -Approved
#
# Requires Blender 4.5 or newer (OptiX on an RTX 5060 Ti) and the three reviewed GLBs.
# Those GLBs are not in git. The script copies them from the synced "BESS MOTORS 3D"
# Google Drive folder when the hashes match. It does not download from the open internet
# and it refuses the VTX file (CC BY-NC-SA).

[CmdletBinding()]
param(
    [ValidateSet("Control", "Film")]
    [string]$Mode = "Control",
    [switch]$Approved
)

$ErrorActionPreference = "Stop"

function Fail([string]$Message) {
    Write-Host "STOP  $Message" -ForegroundColor Red
    exit 2
}

function Info([string]$Message) {
    Write-Host $Message
}

$Repo = (Resolve-Path (Join-Path $PSScriptRoot "..\..\..")).Path
$Env:BESS_REPO = $Repo
$Env:BESS_CYCLES_DEVICE = "GPU"

Info "Repo  $Repo"

# --- Blender 4.5+ -----------------------------------------------------------
$candidates = @()
if ($Env:BESS_BLENDER) { $candidates += $Env:BESS_BLENDER }
$cmd = Get-Command blender -ErrorAction SilentlyContinue
if ($cmd) { $candidates += $cmd.Source }
$found = Get-ChildItem "C:\Program Files\Blender Foundation" -Filter blender.exe -Recurse -ErrorAction SilentlyContinue
foreach ($item in $found) { $candidates += $item.FullName }
$candidates += @(
    "C:\Program Files\Blender Foundation\Blender 4.5\blender.exe",
    "C:\Program Files\Blender Foundation\Blender 4.6\blender.exe",
    "C:\Program Files\Blender Foundation\Blender 5.0\blender.exe"
)
$Blender = $null
$major = 0
$minor = 0
foreach ($candidate in $candidates) {
    if (-not $candidate -or -not (Test-Path -LiteralPath $candidate)) { continue }
    $versionText = & $candidate -b --version 2>&1 | Out-String
    if ($versionText -notmatch "Blender\s+(\d+)\.(\d+)") { continue }
    $tryMajor = [int]$Matches[1]
    $tryMinor = [int]$Matches[2]
    if ($tryMajor -gt $major -or ($tryMajor -eq $major -and $tryMinor -gt $minor)) {
        $major = $tryMajor
        $minor = $tryMinor
        $Blender = $candidate
    }
}
if (-not $Blender) {
    Fail "Blender 4.5 or newer was not found. Install it, or set BESS_BLENDER to blender.exe."
}
if ($major -lt 4 -or ($major -eq 4 -and $minor -lt 5)) {
    Fail "RTX 5060 Ti OptiX needs Blender 4.5 or newer. The newest one found is $major.$minor at $Blender."
}
Info "Blender  $major.$minor  $Blender"

# --- GPU --------------------------------------------------------------------
$smi = Get-Command nvidia-smi -ErrorAction SilentlyContinue
if (-not $smi) {
    Fail "nvidia-smi was not found. This render is for the NVIDIA RTX 5060 Ti, not the CPU."
}
$gpu = & nvidia-smi --query-gpu=name,memory.total --format=csv,noheader
Info "GPU  $gpu"
if ($gpu -notmatch "5060") {
    Write-Host "WARN  The card is not reported as an RTX 5060. The script will still try OptiX, then CUDA." -ForegroundColor Yellow
}

# --- Disk -------------------------------------------------------------------
$driveName = (Get-Item -LiteralPath $Repo).PSDrive.Name
$freeBytes = (Get-PSDrive -Name $driveName).Free
$freeGb = [math]::Round($freeBytes / 1GB, 1)
Info "Free space on ${driveName}:  ${freeGb} GB"
if ($freeBytes -lt 8GB) {
    Fail "Need at least 8 GB free for the 1920x1080 PNG frames. ${freeGb} GB is free."
}

# --- Reviewed GLBs ----------------------------------------------------------
$Expected = @(
    @{
        Label = "G90"
        Dest  = "assets\hero\source\g90\bmw-g90-m5-justgame.glb"
        Sha   = "842f7d94ca1e93cd3ce66abd622638818da3d39edf94a70462552a92aa2f76dc"
        Size  = 30477340
    },
    @{
        Label = "M4"
        Dest  = "assets\hero\source\m4-widebody\bmw-m4-widebody.glb"
        Sha   = "e78b83a33af71793dae97556f1751c77346b27a45311e48bc45d7985b8b10020"
        Size  = 27544152
    },
    @{
        Label = "GT3"
        Dest  = "assets\hero\source\gt3-ccby\bmw-m4-gt3-evo-mattdoesblender.glb"
        Sha   = "6bcdf40c3eb4437dbe1efd7676f95f5314d2984dcaf2735eae9f408422c2174f"
        Size  = 46147100
    }
)
$VtxSha = "b7d79ca09ba472ae5651c578b8b41680c8437c93b59049893816bed6976baceb"

function Get-FileSha([string]$Path) {
    return (Get-FileHash -LiteralPath $Path -Algorithm SHA256).Hash.ToLowerInvariant()
}

function Find-DriveFolder {
    if ($Env:BESS_DRIVE_DIR -and (Test-Path -LiteralPath $Env:BESS_DRIVE_DIR)) {
        return (Resolve-Path -LiteralPath $Env:BESS_DRIVE_DIR).Path
    }
    $roots = New-Object System.Collections.Generic.List[string]
    foreach ($extra in @(
            (Join-Path $Env:USERPROFILE "BESS MOTORS 3D"),
            (Join-Path $Env:USERPROFILE "Google Drive\BESS MOTORS 3D"),
            (Join-Path $Env:USERPROFILE "My Drive\BESS MOTORS 3D")
        )) {
        $roots.Add($extra)
    }
    foreach ($ps in (Get-PSDrive -PSProvider FileSystem)) {
        $roots.Add((Join-Path $ps.Root "My Drive\BESS MOTORS 3D"))
        $roots.Add((Join-Path $ps.Root "BESS MOTORS 3D"))
    }
    foreach ($root in $roots) {
        if ($root -and (Test-Path -LiteralPath $root)) {
            return (Resolve-Path -LiteralPath $root).Path
        }
    }
    return $null
}

function Copy-Reviewed([string]$Source, [string]$Dest, [string]$Sha) {
    $actual = Get-FileSha $Source
    if ($actual -eq $VtxSha) {
        Fail "Refusing $Source. That hash is the VTX CC BY-NC-SA model."
    }
    if ($actual -ne $Sha) {
        Fail "Refusing $Source. SHA-256 is $actual, not the reviewed file $Sha."
    }
    $parent = Split-Path -Parent $Dest
    New-Item -ItemType Directory -Force -Path $parent | Out-Null
    Copy-Item -LiteralPath $Source -Destination $Dest -Force
    Info "Copied  $Source"
}

$missing = @()
foreach ($spec in $Expected) {
    $dest = Join-Path $Repo $spec.Dest
    if (Test-Path -LiteralPath $dest) {
        $sha = Get-FileSha $dest
        if ($sha -eq $VtxSha) { Fail "The GT3 path holds the VTX file. It is not used." }
        if ($sha -eq $spec.Sha) {
            Info "GLB $($spec.Label)  present  $($spec.Size) bytes"
            continue
        }
        Fail "$dest is present but its hash is not the reviewed file ($sha)."
    }
    $missing += $spec
}

if ($missing.Count -gt 0) {
    $drive = Find-DriveFolder
    if (-not $drive) {
        $names = (@($missing | ForEach-Object { $_.Label }) -join ", ")
        Fail "Missing $names. These files are not in git. Sync the Google Drive folder 'BESS MOTORS 3D' with your own Google account, or set BESS_DRIVE_DIR to that folder, then run this script again."
    }
    Info "Drive folder  $drive"
    $pool = @(Get-ChildItem -LiteralPath $drive -Recurse -File -ErrorAction SilentlyContinue |
        Where-Object { $_.Extension -in ".glb", ".zip" })
    foreach ($spec in $missing) {
        $dest = Join-Path $Repo $spec.Dest
        $hit = $null
        foreach ($file in $pool) {
            if ($file.Extension -eq ".zip") { continue }
            if ($file.Length -ne $spec.Size) { continue }
            if ((Get-FileSha $file.FullName) -eq $spec.Sha) { $hit = $file.FullName; break }
        }
        if (-not $hit -and $spec.Label -eq "GT3") {
            $zip = $pool | Where-Object { $_.Name -eq "bmw-m4-gt3-evo.zip" } | Select-Object -First 1
            if ($zip) {
                $unpack = Join-Path $Env:TEMP "bess-gt3-unpack"
                if (Test-Path $unpack) { Remove-Item -LiteralPath $unpack -Recurse -Force }
                Expand-Archive -LiteralPath $zip.FullName -DestinationPath $unpack -Force
                foreach ($file in (Get-ChildItem -LiteralPath $unpack -Recurse -Filter *.glb)) {
                    if ((Get-FileSha $file.FullName) -eq $spec.Sha) { $hit = $file.FullName; break }
                }
            }
        }
        if (-not $hit) {
            Fail "The Drive folder does not contain the reviewed $($spec.Label) file (SHA-256 $($spec.Sha))."
        }
        Copy-Reviewed $hit $dest $spec.Sha
    }
}

# --- Render -----------------------------------------------------------------
if ($Mode -eq "Film" -and -not $Approved) {
    Fail "The 12-second film stays off until you have watched the 2-second control. Re-run with -Mode Film -Approved."
}

$frameDir = Join-Path $Repo "assets\hero\renders\lineup-v2"
if ($Mode -eq "Control") {
    $Env:BESS_FRAME_START = "42"
    $Env:BESS_FRAME_END = "89"
    $flag = "--gpu-control"
    $folder = Join-Path $frameDir "gpu-control"
    $mp4 = Join-Path $frameDir "gpu-control.mp4"
    $startNumber = 42
    $frameCount = 48
} else {
    $Env:BESS_FILM_APPROVED = "1"
    $Env:BESS_FRAME_START = "0"
    $Env:BESS_FRAME_END = "287"
    $flag = "--gpu-film"
    $folder = Join-Path $frameDir "gpu-film"
    $mp4 = Join-Path $frameDir "gpu-film.mp4"
    $startNumber = 0
    $frameCount = 288
}
if (-not $Env:BESS_SAMPLES) { $Env:BESS_SAMPLES = "128" }
New-Item -ItemType Directory -Force -Path $folder | Out-Null
Info "Frames  $folder"
Info "Mode  $Mode   $($Env:BESS_FRAME_START)-$($Env:BESS_FRAME_END)   max samples $($Env:BESS_SAMPLES)"
Info "An existing PNG larger than 200 KB is kept, so a stopped render continues."

& $Blender -b --python-exit-code 7 --python (Join-Path $Repo "scripts\cinematic-hero\render_lineup.py") -- $flag
if ($LASTEXITCODE -ne 0) {
    Fail "Blender exited with code $LASTEXITCODE. Finished PNGs were kept."
}

$pngs = @(Get-ChildItem -LiteralPath $folder -Filter "f*.png" | Where-Object { $_.Length -ge 200KB })
Info "PNG frames on disk: $($pngs.Count) / $frameCount"
if ($pngs.Count -lt $frameCount) {
    Fail "Render is incomplete: $($pngs.Count) of $frameCount PNGs exist. Inspect Blender errors and run again to resume."
}

$ffmpeg = Get-Command ffmpeg -ErrorAction SilentlyContinue
if (-not $ffmpeg) {
    Info "ffmpeg is not installed. The PNGs are the render. Install ffmpeg, then re-run this script to encode the MP4. Nothing is scaled."
    exit 0
}
if ($pngs.Count -lt $frameCount) {
    Info "Not encoding yet. $frameCount continuous frames are required, and $($pngs.Count) are finished."
    exit 0
}
& ffmpeg -y -framerate 24 -start_number $startNumber -i (Join-Path $folder "f%04d.png") -frames:v $frameCount -c:v libx264 -pix_fmt yuv420p -crf 16 -movflags +faststart $mp4
if ($LASTEXITCODE -ne 0) { Fail "ffmpeg exited with code $LASTEXITCODE." }
Info "MP4  $mp4"
Info "1920x1080, 24 fps, H.264, from the PNG frames. No upscale."
