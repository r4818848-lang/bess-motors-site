# Local Windows pipeline for the V8 still

Cloud GPU rental is cancelled for this stage. The machine is the owner's PC: Windows 11, RTX 5060 Ti 8 GB, Ryzen 7 7800X3D, 32 GB RAM.

Nothing in this folder has been executed on that PC. The cloud agent checked the file list, the licenses, the checksums, and the workflow slots. It did not download the weights and it did not generate an image. A PNG is an AI frame only after ComfyUI on that PC has written it.

Qwen-Image-Edit-2511 is not part of this setup. The transformer alone is 40.86 GB. It does not fit in 8 GB.

## What to install

ComfyUI 0.45.0 portable, the NVIDIA package, not the cu126 package. The cu126 build is the one the project ships for 10-series cards. The default NVIDIA archive is the CUDA 13.0 / Python 3.13 build, which is the one current ComfyUI docs point at for RTX cards. Blackwell needs a PyTorch build that contains `sm_120`. The script runs one CUDA allocation after install. If that printout fails with `no kernel image`, update the NVIDIA driver before any model download.

The server is bound to `127.0.0.1:8188` and started with `--offline`, so partner and paid API nodes stay off. Do not add a bare `--listen`. That opens the service on every interface.

From this folder, in PowerShell:

```powershell
.\Install-BessComfy.ps1 -Install
.\Install-BessComfy.ps1 -DownloadModels
.\Install-BessComfy.ps1 -CheckGpu
.\Install-BessComfy.ps1 -Launch
```

`-Install` downloads the 2.07 GB portable archive and copies `docs/review/v8-beauty.png` into ComfyUI's input folder as `v8-beauty.png`. `-DownloadModels` then fetches only the three files below and checks the SHA-256. FLUX is not downloaded.

## Models

| File | License | Bytes | Use on 8 GB |
| --- | --- | --- | --- |
| [sd_xl_base_1.0.safetensors](https://huggingface.co/stabilityai/stable-diffusion-xl-base-1.0/resolve/main/sd_xl_base_1.0.safetensors) | CreativeML Open RAIL++-M (`openrail++`) | 6,938,078,334 | Checkpoint. Commercial use is allowed under the license's use restrictions. It is not Apache-2.0. |
| [sdxl_vae.safetensors](https://huggingface.co/madebyollin/sdxl-vae-fp16-fix/resolve/main/sdxl_vae.safetensors) | MIT | 334,641,162 | Replaces the stock SDXL VAE, which can go black in fp16. |
| [xinsir union ProMax](https://huggingface.co/xinsir/controlnet-union-sdxl-1.0/resolve/main/diffusion_pytorch_model_promax.safetensors) | Apache-2.0 | 2,513,342,408 | One ControlNet for Canny and depth. Saved locally as `xinsir-controlnet-union-sdxl-promax.safetensors`. |

SHA-256, in the same order: `31e35c80fc4829d14f90153f4c74cd59c90b779f6afe05a74cd6120b893f7e5b`, `235745af8d86bf4a4c1b5b4f529868b37019a10f7c0b2e79ad0abca3a22bc6e1`, `9fae2e50cb431bfcbe05822b59ec2228df545ef27f711dea8949e9f4ed9f7cdc`.

Do not substitute Juggernaut, RealVis, or another SDXL fine-tune. Those cards often forbid commercial use. The official SDXL base is the checkpoint this workflow names.

Stability's diffusers ControlNets are also Open RAIL++ and about 2.50 GB each in fp16. They are not downloaded. The xinsir union file is Apache-2.0 and covers both conditions.

## 8 GB settings

The graph scales the 1920×1080 beauty to 896×512 before the encode. That is the first size. If the card finishes with memory to spare, raise it to 1024×576 inside the ImageScale nodes. Do not start at 1920×1080.

| Knob | Value | Why |
| --- | --- | --- |
| Steps | 20 | Enough for a low-denoise edit. |
| CFG | 5.5 | A higher CFG restyles the cars. |
| Sampler | euler / normal | Built into ComfyUI 0.45. |
| Seed | 7, fixed | The other two tries are seeds 11 and 21. |
| Denoise | 0.32 | The other two tries are 0.22 and 0.42. Above 0.45 the bodies start to move. |
| ControlNet | 0.55, full range ending at 0.8 | Canny holds the silhouette. It does not prove the headlights stayed. |
| Launch | `--reserve-vram 1.2` | Leaves room for the desktop. Dynamic VRAM is ComfyUI's own offload. `--lowvram` does nothing while that is on. |

Open `workflows/v8-sdxl-canny.json` in the ComfyUI window and queue it. The Canny node is built in. No custom node is installed.

`workflows/v8-sdxl-depth.json` is the same graph with union type `depth` and a second input, `v8-depth.png`. That file is not rendered yet. Queue the Canny graph first. Reject a frame whose car count, wheels, colours, or stance moved, even if the paint looks better.

## FLUX.1 schnell GGUF, not installed

`city96/FLUX.1-schnell-gguf` `flux1-schnell-Q4_K_S.gguf` is 6,783,943,712 bytes, SHA-256 `4fd16477b3a5296d0cf722c4b92a9fd7f30d09ac7495826e4465d8de9c9fd973`, license Apache-2.0, the same license as the original FLUX.1-schnell weights. A usable text stack adds `clip_l.safetensors` (0.25 GB) and an fp8 T5 (about 4.89 GB) from `comfyanonymous/flux_text_encoders`, also Apache-2.0.

ComfyUI 0.45 has no GGUF loader. Running it needs the third-party node `city96/ComfyUI-GGUF`, which this script does not install. On 8 GB the Q4 diffusion file already fills the card, and schnell is a text-to-image model. It will not keep the three BMW bodies. It is a later sketch tool, not the edit that protects the Blender scene.

## Putting a real frame on PR #39

After a queue finishes, the PNG lands in `ComfyUI\output\bess-v8-sdxl-canny_00001_.png`. From the repo:

```powershell
.\scripts\cinematic-hero\comfy\windows\Install-BessComfy.ps1 -StageResults -RepoRoot .
```

That copies the PNG into `docs/review/`. Commit the PNG only. Do not commit the portable folder or the weights. The PR text should say which seed and denoise produced it, and that the geometry still has to be accepted by eye.

## Blender on the same PC

The render script stays on CPU unless the environment says otherwise. In `cmd`, from the repo, with Blender 4.5 or newer on the PATH:

```bat
set BESS_CYCLES_DEVICE=GPU
blender -b --python scripts\cinematic-hero\render_lineup.py -- --v8
```

The script tries OptiX, then CUDA, and prints which one it enabled. If neither enables, it stays on CPU. This is the stills pass. The 12-second Cycles film is still waiting for the still to be accepted. The site hero stays a poster until that film exists: autoplay, muted, playsInline, no loop, stopped on the last frame.
