# Image edit for the V8 still

Cloud GPU rental is cancelled. The current path is the Windows PC with an RTX 5060 Ti 8 GB, documented in `windows/README.md`. Qwen-Image-Edit-2511 is not installed for that card. The notes below are the earlier 80 GB recipe and are not the next step.

This is one image editor. Wan, LTX, and FLUX are not part of the 80 GB recipe. ComfyUI is the optional official UI for the same model, not a second model to install beside it.

Nothing here has produced an image. The Cloud Agent that wrote this file has no GPU. `edit_hero.py` exits before `from_pretrained` when CUDA is missing, so the 57.72 GB of weights are not on this machine.

## What the script actually calls

The model card for `Qwen/Qwen-Image-Edit-2511` (Apache-2.0) names `QwenImageEditPlusPipeline`. That class is in Diffusers 0.43.0, released 12 Nov 2026. The card itself was written against `diffusers 0.36.0.dev0` and uses the same class. The pinned stack is `requirements-gpu.txt`.

The official card loads the pipeline and calls `pipeline.to("cuda")`. That call keeps the whole model on the GPU. It is not offloading. The transformer files alone are 40.86 GB. The text encoder is 16.58 GB. The VAE is 0.25 GB. The tree sums to 57.72 GB.

`edit_hero.py` picks the mode from the card's reported VRAM before it downloads anything:

| Reported VRAM | Mode | What runs | Status |
| --- | --- | --- | --- |
| 75 GB and above | `resident` | `pipeline.to("cuda")` | Official card path. First test. Use an 80 GB card. |
| 48 GB to 75 GB | `model-offload` | `enable_model_cpu_offload()`, sequence `text_encoder->transformer->vae` | The method is the one Diffusers ships on this pipeline. It has not been run here. The transformer still has to sit on the GPU, so this is not a 24 GB mode. |
| Under 48 GB | none | the script exits 2 | A 24 GB card is not a verified configuration. |
| any CUDA GPU, only with `--memory sequential` | `sequential` | `enable_sequential_cpu_offload()` | Implemented, never run. Passing the flag does not make it verified. |

A successful run writes `memory_mode_verified_on_this_gpu: true` in the sidecar JSON for the mode that actually finished. Until that file exists, neither offload mode is verified.

## First machine

One NVIDIA GPU with 80 GB (A100 80GB or H100 80GB), 64 GB of system RAM, and 120 GB of free disk. Resident mode. No quantization. System RAM matters because the loader stages the files in CPU memory before they move to the card.

Public on-demand ranges read on 13 Nov 2026, not a quote and not a reservation:

- A100 80GB, about $0.87–$1.72 per hour on marketplace listings, about $3.04 on an OVH list price.
- H100 80GB, about $2.69–$3.49 per hour at the low end, median listings around $3.19–$3.87.

A first session is the 57.72 GB download plus three stills. Allow two hours so a failed load is included. That is roughly $2–$6 on an A100 at the published low-to-mid rates, or roughly $6–$8 on an H100 at the published lows. The provider and the tax are the owner's choice. This agent has not opened an account.

An L40S (48 GB, about $0.95–$1.70 per hour in the same listings) can be tried later with `--memory model-offload`. Do not start there. The transformer is 40.86 GB before activations, so a 48 GB card can still run out of memory. If it does, the script exits 3 and does not launch a second mode.

## What the owner runs

On the GPU machine, from a checkout of `feat/bess-cinematic-hero-v2`:

```bash
bash scripts/cinematic-hero/comfy/install-gpu.sh
source "$HOME/bess-qwen-edit/bin/activate"
python3 scripts/cinematic-hero/comfy/edit_hero.py \
  --input docs/review/v8-beauty.png \
  --reference /path/to/the-studio-reference.png \
  --output docs/review/v8-ai \
  --variant all
```

`--variant all` writes three files when `--reference` is present:

| File | Steps | true_cfg_scale | Seed | Reference |
| --- | --- | --- | --- | --- |
| `v8-ai-conservative.png` | 20 | 2.5 | 7 | no |
| `v8-ai-official.png` | 40 | 4.0 | 11 | no |
| `v8-ai-reference.png` | 40 | 4.0 | 21 | picture 2 |

Seeds use a CPU `torch.Generator`, which is the reproducible generator from the model card's `torch.manual_seed` example. Each PNG gets a JSON sidecar with the prompt, the seed, the GPU name, the VRAM, the peak bytes, the seconds, and a colour sample of the three body panels. The script does not pick a winner. A frame whose sampled panel changes from green, blue, or burgundy is marked `generated-colour-drift`. Colour samples are not a proof that the body, the wheels, or the lamps stayed put. Reject a pretty frame that moved them.

Picture 2 is a lighting reference only. The prompt tells the model not to copy that photograph's cars, logo, or layout. The right-hand GT3 grille is pale because those slats are part of the body shell (`GRILLE darkened=0` on the V8 pass). The prompt forbids redrawing that grille. Fixing it is a mesh edit, not an inpaint.

The official ComfyUI graph for this model is `templates/image_qwen_image_edit_2511.json` in [Comfy-Org/workflow_templates](https://github.com/Comfy-Org/workflow_templates). Its edit node is `TextEncodeQwenImageEditPlus`. Use that template, or this Diffusers script, not both in one session. This folder does not vendor a rewritten copy of that graph.

Do not commit the virtualenv, the Hugging Face cache, or the weight files.
