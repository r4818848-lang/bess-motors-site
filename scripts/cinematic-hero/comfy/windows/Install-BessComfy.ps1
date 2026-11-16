# Local ComfyUI for the V8 still. Windows 11, RTX 5060 Ti, 8 GB VRAM.
# This script does not open a public port and does not call a paid API.
# Run it on the owner's PC. The cloud agent must not be treated as a finished generation.

[CmdletBinding()]
param(
    [switch]$Install,
    [switch]$DownloadModels,
    [switch]$Launch,
    [switch]$CheckGpu,
    [switch]$StageResults,
    [string]$Destination = "$env:LOCALAPPDATA\BessMotors\ComfyUI",
    [string]$RepoRoot = ""
)

$ErrorActionPreference = "Stop"
$ListenHost = "127.0.0.1"
$ListenPort = 8188
$PortableUrl = "https://github.com/Comfy-Org/ComfyUI/releases/download/v0.45.0/ComfyUI_windows_portable_nvidia.7z"
$PortableBytes = 2071479423

$Models = @(
    @{
        Name = "sd_xl_base_1.0.safetensors"
        Url = "https://huggingface.co/stabilityai/stable-diffusion-xl-base-1.0/resolve/main/sd_xl_base_1.0.safetensors"
        Sha256 = "31e35c80fc4829d14f90153f4c74cd59c90b779f6afe05a74cd6120b893f7e5b"
        Bytes = 6938078334
        Folder = "checkpoints"
    },
    @{
        Name = "sdxl_vae.safetensors"
        Url = "https://huggingface.co/madebyollin/sdxl-vae-fp16-fix/resolve/main/sdxl_vae.safetensors"
        Sha256 = "235745af8d86bf4a4c1b5b4f529868b37019a10f7c0b2e79ad0abca3a22bc6e1"
        Bytes = 334641162
        Folder = "vae"
    },
    @{
        Name = "xinsir-controlnet-union-sdxl-promax.safetensors"
        Url = "https://huggingface.co/xinsir/controlnet-union-sdxl-1.0/resolve/main/diffusion_pytorch_model_promax.safetensors"
        Sha256 = "9fae2e50cb431bfcbe05822b59ec2228df545ef27f711dea8949e9f4ed9f7cdc"
        Bytes = 2513342408
        Folder = "controlnet"
    }
)

function Assert-LocalOnly {
    if ($ListenHost -ne "127.0.0.1") {
        throw "Refusing to listen on anything except 127.0.0.1."
    }
}

function Get-RepoRoot {
    if ($RepoRoot) { return (Resolve-Path $RepoRoot).Path }
    $candidate = Resolve-Path (Join-Path $PSScriptRoot "..\..\..\..") -ErrorAction SilentlyContinue
    if ($null -eq $candidate) { return "" }
    return $candidate.Path
}

function Save-VerifiedFile {
    param($Url, $Path, $Sha256, $Bytes)
    $dir = Split-Path -Parent $Path
    New-Item -ItemType Directory -Force -Path $dir | Out-Null
    if (Test-Path $Path) {
        $existing = Get-Item $Path
        if ($existing.Length -eq $Bytes) {
            $have = (Get-FileHash -Algorithm SHA256 -Path $Path).Hash.ToLower()
            if ($have -eq $Sha256) {
                Write-Host "already present $Path"
                return
            }
        }
        Remove-Item $Path -Force
    }
    Write-Host "downloading $Url"
    curl.exe --fail --location --continue-at - --output $Path $Url
    if ($LASTEXITCODE -ne 0) { throw "download failed: $Url" }
    $got = (Get-FileHash -Algorithm SHA256 -Path $Path).Hash.ToLower()
    if ($got -ne $Sha256) {
        throw "checksum mismatch for $Path"
    }
    Write-Host "verified $Path"
}

Assert-LocalOnly

if (-not ($Install -or $DownloadModels -or $Launch -or $CheckGpu -or $StageResults)) {
    Write-Host "No action requested. On the Windows PC:"
    Write-Host "  .\Install-BessComfy.ps1 -Install"
    Write-Host "  .\Install-BessComfy.ps1 -DownloadModels"
    Write-Host "  .\Install-BessComfy.ps1 -CheckGpu"
    Write-Host "  .\Install-BessComfy.ps1 -Launch"
    Write-Host "  .\Install-BessComfy.ps1 -StageResults"
    Write-Host "ComfyUI stays on 127.0.0.1. Qwen-Image-Edit-2511 is not downloaded."
    exit 0
}

$root = $Destination
$portable = Join-Path $root "ComfyUI_windows_portable"
$python = Join-Path $portable "python_embeded\python.exe"
$main = Join-Path $portable "ComfyUI\main.py"
$repo = Get-RepoRoot

if ($Install) {
    $free = (Get-PSDrive -Name ($root.Substring(0, 1))).Free
    if ($free -lt 25GB) { throw "Need at least 25 GB free on the destination drive." }
    New-Item -ItemType Directory -Force -Path $root | Out-Null
    $archive = Join-Path $root "ComfyUI_windows_portable_nvidia.7z"
    if ((Test-Path $archive) -and (Get-Item $archive).Length -ne $PortableBytes) {
        Remove-Item $archive -Force
    }
    if (-not (Test-Path $archive)) {
        Write-Host "downloading portable ComfyUI 0.45.0 CUDA build"
        curl.exe --fail --location --continue-at - --output $archive $PortableUrl
        if ($LASTEXITCODE -ne 0) { throw "portable download failed" }
    }
    if (-not (Test-Path $python)) {
        if (Get-Command tar.exe -ErrorAction SilentlyContinue) {
            tar.exe -xf $archive -C $root
        } elseif (Get-Command 7z.exe -ErrorAction SilentlyContinue) {
            7z.exe x $archive "-o$root" -y
        } else {
            throw "Need tar.exe or 7z.exe to extract the portable archive."
        }
    }
    if (-not (Test-Path $python)) { throw "Portable Python was not found after extract." }
    $workflowDir = Join-Path $portable "ComfyUI\user\default\workflows"
    New-Item -ItemType Directory -Force -Path $workflowDir | Out-Null
    if ($repo) {
        Copy-Item (Join-Path $repo "scripts\cinematic-hero\comfy\windows\workflows\*.json") $workflowDir -Force
        $inputDir = Join-Path $portable "ComfyUI\input"
        New-Item -ItemType Directory -Force -Path $inputDir | Out-Null
        # The graph still loads a file named v8-beauty.png. The pixels are the V9 still.
        $sourceStill = Join-Path $repo "docs\review\v9-beauty.png"
        if (-not (Test-Path $sourceStill)) {
            $sourceStill = Join-Path $repo "docs\review\v8-beauty.png"
        }
        Copy-Item $sourceStill (Join-Path $inputDir "v8-beauty.png") -Force
    }
    Write-Host "installed under $portable"
}

if ($DownloadModels) {
    if (-not (Test-Path $python)) { throw "Run -Install before -DownloadModels." }
    $modelRoot = Join-Path $portable "ComfyUI\models"
    foreach ($model in $Models) {
        $path = Join-Path $modelRoot (Join-Path $model.Folder $model.Name)
        Save-VerifiedFile -Url $model.Url -Path $path -Sha256 $model.Sha256 -Bytes $model.Bytes
    }
    Write-Host "models verified. FLUX GGUF and Qwen were not downloaded."
}

if ($CheckGpu -or $Launch) {
    if (-not (Test-Path $python)) { throw "Run -Install before a GPU check." }
    & $python -c "import torch; print('torch', torch.__version__); print('cuda', torch.version.cuda); ok=torch.cuda.is_available(); print('available', ok); assert ok, 'CUDA is not available'; name=torch.cuda.get_device_name(0); total=torch.cuda.get_device_properties(0).total_memory; print('gpu', name); print('vram_gb', round(total/1024**3, 2)); x=torch.zeros(8, device='cuda'); print('matmul', float((x @ x).sum()))"
    if ($LASTEXITCODE -ne 0) { throw "The GPU test failed. Update the NVIDIA driver before generating." }
}

if ($Launch) {
    Assert-LocalOnly
    Write-Host "Open http://127.0.0.1:$ListenPort only on this PC. Do not add --listen without an address."
    & $python -s $main --listen $ListenHost --port $ListenPort --offline --reserve-vram 1.2 --windows-standalone-build
    exit $LASTEXITCODE
}

if ($StageResults) {
    if (-not $repo) { throw "Pass -RepoRoot pointing at the bess-motors-site checkout." }
    $output = Join-Path $portable "ComfyUI\output"
    $review = Join-Path $repo "docs\review"
    $found = Get-ChildItem -Path $output -Filter "bess-v8-sdxl-*.png" -ErrorAction SilentlyContinue
    if (-not $found) { throw "No bess-v8-sdxl PNG was found. Generation has not run." }
    foreach ($file in $found) {
        Copy-Item $file.FullName (Join-Path $review $file.Name) -Force
        Write-Host "staged $($file.Name)"
    }
    Write-Host "Commit only those PNGs. Do not commit models, the portable folder, or the Hugging Face cache."
}
