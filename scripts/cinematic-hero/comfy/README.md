# Hero image edit — not executed on this machine

This folder is the recipe for a later GPU run. On the Cloud Agent that prepared V8, `edit_hero.py` was started once and exited with code 2 before any download, because PyTorch is not installed and there is no CUDA device. No image was written. ComfyUI was not installed.

That machine has no NVIDIA GPU, no `/dev/dri`, and no CUDA. System RAM is 15 GB. It is not a video card. Qwen-Image-Edit-2511 is a 20B model, about 58 GB of weights. Running it on this CPU is not a usable pass, so the weights were not downloaded.

## What to run

Use one image editor, not five models at once.

1. A Linux or Windows box with an NVIDIA GPU. 24 GB of VRAM is the practical floor for Qwen-Image-Edit-2511 in bf16 with offload. More is better. Do not start if `nvidia-smi` does not show a GPU.
2. Install [ComfyUI](https://github.com/Comfy-Org/ComfyUI) from the official repository (GPL-3.0). The app already has a Qwen-Image template. Do not install random custom nodes.
3. Download only `Qwen/Qwen-Image-Edit-2511` (Apache-2.0, about 58 GB). Put the files where that ComfyUI template expects them.
4. Load `docs/review/v8-beauty.png` once it exists, or the V8 beauty still from the render folder. Prompt:

   Keep the three cars, their positions, wheels, and body shapes. Left car stays saturated green. Centre car stays metallic royal blue. Right car stays glossy burgundy. Make the paint, glass, headlights, and floor reflections look like a real studio photograph. Do not add cars, doors, wheels, or headlights. Do not change the colours.

5. Reject the result if the silhouette, the kidney grille, the wheel count, or the colours move. A pretty wrong car is a failed frame.
6. Do not run Wan 2.2 or LTX-2 on the 12-second shot until a still frame survives that check. Wan 2.2 TI2V-5B is Apache-2.0 and about 32 GB of weights. LTX-2 weights are under the LTX-2 Community License, not Apache-2.0. Companies with at least $10M annual revenue need a paid license. Neither video model was downloaded here.

FLUX.1-schnell (Apache-2.0, 23.8 GB for `flux1-schnell.safetensors`) is a text-to-image model. It is the commercial FLUX variant. FLUX.1-dev is non-commercial. Schnell does not replace the Blender scene. It was not downloaded.

## Diffusers entry point

`edit_hero.py` in this folder calls `QwenImageEditPlusPipeline` and exits immediately when CUDA is missing. That is the same stack as the official Qwen-Image README. Run it only on the GPU machine, from this directory, after the weights are cached:

```bash
python3 edit_hero.py --input ../../../docs/review/v8-beauty.png --output ../../../docs/review/v8-ai-edit.png
```

The script does not call a paid API.
