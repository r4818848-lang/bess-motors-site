"""One Qwen-Image-Edit-2511 pass over the V8 Blender beauty still.

The pipeline class is the official Diffusers class named by the model card:
QwenImageEditPlusPipeline. This file does not download weights and does not
run inference unless CUDA is available. A CPU machine exits before any load.

Memory modes, chosen from the card's reported VRAM before the weights load:

- resident: pipeline.to("cuda"). This is the official model-card call. It is
  the mode for an 80 GB card. It is not offloading.
- model-offload: pipeline.enable_model_cpu_offload(). The class declares
  model_cpu_offload_seq = "text_encoder->transformer->vae". The transformer
  file is 40.86 GB, so this mode still needs that module on the GPU. It is
  implemented here. It has not been run, so it is not a verified 24 GB mode.
- sequential: pipeline.enable_sequential_cpu_offload(). Official Diffusers
  hook, one submodule at a time. It has not been run. Ask for it explicitly.

Nothing in this file is an AI-enhanced frame until a CUDA run writes the PNG
and the sidecar JSON says status "generated".
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import shutil
import sys
import time
from pathlib import Path

MODEL_ID = "Qwen/Qwen-Image-Edit-2511"
WEIGHT_BYTES = 57_720_000_000
TRANSFORMER_BYTES = 40_860_000_000
RESIDENT_VRAM_GB = 75.0
OFFLOAD_VRAM_GB = 48.0
MIN_FREE_BYTES = 80 * 1024**3

PROMPT = (
    "Picture 1 is the only image to edit. Keep exactly three cars in the same places. "
    "The left car stays a saturated green BMW M4 widebody, paint near #187A3C. "
    "The centre car stays a metallic royal blue BMW M5, paint near #0E3F96. "
    "The right car stays a glossy burgundy BMW M4 GT3, paint near #8E1C2A. "
    "Keep the body shapes, the wheel count, the camera, the spacing, and the stance. "
    "Improve the clearcoat, the glass, the tire and wheel detail, the studio reflections, "
    "and the coloured light on the floor under each car. "
    "Do not add cars, doors, wheels, or headlights. "
    "Do not redraw the right car's grille or lamps."
)
REFERENCE_SENTENCE = (
    " Picture 2 is a lighting and material reference only. "
    "Do not copy its cars, its logo, or its background."
)
NEGATIVE = "extra car, extra wheel, extra headlight, deformed body, changed paint colour, text, logo"

VARIANTS = (
    {"name": "conservative", "steps": 20, "true_cfg_scale": 2.5, "seed": 7, "use_reference": False},
    {"name": "official", "steps": 40, "true_cfg_scale": 4.0, "seed": 11, "use_reference": False},
    {"name": "reference", "steps": 40, "true_cfg_scale": 4.0, "seed": 21, "use_reference": True},
)

# Fractions measured on the 1920x1080 V8 beauty body panels.
BODY_SAMPLES = (("left", 0.18, 0.42), ("centre", 0.48, 0.40), ("right", 0.78, 0.42))


def choose_memory(vram_gb: float | None, requested: str) -> tuple[str, str]:
    """Return the mode and a note. Raise ValueError when the card is too small."""
    if requested == "sequential":
        if vram_gb is None:
            raise ValueError("sequential offload needs a CUDA device")
        return (
            "sequential",
            "enable_sequential_cpu_offload is implemented and has not been run. "
            "This is not a verified 24 GB configuration.",
        )
    if requested == "resident":
        if vram_gb is None or vram_gb < RESIDENT_VRAM_GB:
            raise ValueError(
                f"resident mode is pipeline.to('cuda') and needs about 80 GB. "
                f"This card reports {vram_gb} GB. Refusing to load the full model onto it."
            )
        return ("resident", "pipeline.to('cuda'), the official model-card call. This is not offloading.")
    if requested == "model-offload":
        if vram_gb is None or vram_gb < OFFLOAD_VRAM_GB:
            raise ValueError(
                f"model offload still places the {TRANSFORMER_BYTES / 1e9:.2f} GB transformer on the GPU. "
                f"This card reports {vram_gb} GB, under the {OFFLOAD_VRAM_GB:.0f} GB floor. "
                "24 GB is not a verified mode."
            )
        return (
            "model-offload",
            "enable_model_cpu_offload follows text_encoder->transformer->vae. "
            "Implemented, not yet run on a GPU in this project.",
        )
    if vram_gb is None:
        raise ValueError("CUDA is not available")
    if vram_gb >= RESIDENT_VRAM_GB:
        return choose_memory(vram_gb, "resident")
    if vram_gb >= OFFLOAD_VRAM_GB:
        return choose_memory(vram_gb, "model-offload")
    raise ValueError(
        f"This card reports {vram_gb:.1f} GB. The first test is an 80 GB GPU in resident mode. "
        "A 24 GB card is not a verified configuration, so the weights will not be loaded."
    )


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def paint_label(rgb: tuple[float, float, float]) -> str | None:
    r, g, b = rgb
    if g > 40 and g > r + 12 and g > b + 8:
        return "green"
    if b > 40 and b > r + 8 and b > g:
        return "blue"
    if r > 40 and r > g + 15 and r > b:
        return "burgundy"
    return None


def sample_bodies(path: Path) -> dict[str, dict]:
    from PIL import Image

    image = Image.open(path).convert("RGB")
    width, height = image.size
    found = {}
    for name, fx, fy in BODY_SAMPLES:
        x = min(width - 1, max(0, int(width * fx)))
        y = min(height - 1, max(0, int(height * fy)))
        total = [0, 0, 0]
        count = 0
        for dy in range(-8, 9):
            for dx in range(-8, 9):
                xx = min(width - 1, max(0, x + dx))
                yy = min(height - 1, max(0, y + dy))
                pixel = image.getpixel((xx, yy))
                total[0] += pixel[0]
                total[1] += pixel[1]
                total[2] += pixel[2]
                count += 1
        rgb = tuple(round(channel / count, 1) for channel in total)
        found[name] = {"rgb": rgb, "label": paint_label(rgb)}
    return found


def identity_report(source: Path, result: Path) -> dict:
    before = sample_bodies(source)
    after = sample_bodies(result)
    drifts = []
    for name, _fx, _fy in BODY_SAMPLES:
        left = before[name]["label"]
        right = after[name]["label"]
        if left is not None and left != right:
            drifts.append({"car": name, "source": left, "result": right})
    return {
        "source": before,
        "result": after,
        "drifts": drifts,
        "colours_held": not drifts,
        "note": "Colour samples are not a geometry proof. Reject a frame whose body, wheels, or lamps move.",
    }


def selected_variants(name: str, reference: Path | None) -> list[dict]:
    if name == "all":
        chosen = list(VARIANTS)
    else:
        chosen = [item for item in VARIANTS if item["name"] == name]
        if not chosen:
            raise ValueError(f"Unknown variant {name}")
    ready = []
    for item in chosen:
        if item["use_reference"] and reference is None:
            continue
        ready.append(item)
    if not ready:
        raise ValueError("The reference variant needs --reference, and no other variant was requested.")
    return ready


def output_path(output: Path, variant: str, several: bool) -> Path:
    if several:
        output.mkdir(parents=True, exist_ok=True)
        return output / f"v8-ai-{variant}.png"
    if output.suffix.lower() != ".png":
        raise ValueError("--output must be a .png file when running one variant")
    output.parent.mkdir(parents=True, exist_ok=True)
    return output


def place_pipeline(pipe, mode: str, note: str):
    if mode == "resident":
        pipe.to("cuda")
    elif mode == "model-offload":
        pipe.enable_model_cpu_offload()
    elif mode == "sequential":
        pipe.enable_sequential_cpu_offload()
    else:
        raise ValueError(mode)
    return note


def write_json(path: Path, payload: dict) -> None:
    path.write_text(json.dumps(payload, indent=2) + "\n")


def run_inference(args, variants: list[dict], mode: str, note: str) -> int:
    import torch
    from diffusers import QwenImageEditPlusPipeline
    from PIL import Image

    cache = Path(os.environ.get("HF_HOME", Path.home() / ".cache" / "huggingface"))
    free = shutil.disk_usage(cache if cache.exists() else cache.parent).free
    if free < MIN_FREE_BYTES:
        print(
            f"Only {free / 1e9:.1f} GB is free under {cache}. "
            f"The weights are {WEIGHT_BYTES / 1e9:.2f} GB. Refusing to download.",
            file=sys.stderr,
        )
        return 2

    source = Image.open(args.input).convert("RGB")
    reference = Image.open(args.reference).convert("RGB") if args.reference else None
    started = time.perf_counter()
    pipe = QwenImageEditPlusPipeline.from_pretrained(MODEL_ID, torch_dtype=torch.bfloat16)
    place_pipeline(pipe, mode, note)
    pipe.set_progress_bar_config(disable=False)
    load_seconds = round(time.perf_counter() - started, 1)

    several = len(variants) > 1
    exit_code = 0
    for item in variants:
        destination = output_path(args.output, item["name"], several)
        sidecar = destination.with_suffix(".json")
        images = [source]
        prompt = PROMPT
        if item["use_reference"]:
            images.append(reference)
            prompt = PROMPT + REFERENCE_SENTENCE
        payload = {
            "status": "started",
            "model": MODEL_ID,
            "pipeline": "QwenImageEditPlusPipeline",
            "diffusers": __import__("importlib.metadata").metadata.version("diffusers"),
            "torch": torch.__version__,
            "gpu": torch.cuda.get_device_name(0),
            "vram_gb": round(torch.cuda.get_device_properties(0).total_memory / (1024**3), 2),
            "memory_mode": mode,
            "memory_note": note,
            "memory_mode_verified_on_this_gpu": False,
            "variant": item["name"],
            "seed": item["seed"],
            "steps": item["steps"],
            "true_cfg_scale": item["true_cfg_scale"],
            "guidance_scale": 1.0,
            "prompt": prompt,
            "negative_prompt": NEGATIVE,
            "input": str(args.input),
            "input_sha256": sha256(args.input),
            "reference": str(args.reference) if args.reference else None,
            "reference_sha256": sha256(args.reference) if args.reference else None,
            "load_seconds": load_seconds,
        }
        torch.cuda.reset_peak_memory_stats()
        tick = time.perf_counter()
        try:
            with torch.inference_mode():
                result = pipe(
                    image=images,
                    prompt=prompt,
                    negative_prompt=NEGATIVE,
                    true_cfg_scale=item["true_cfg_scale"],
                    guidance_scale=1.0,
                    num_inference_steps=item["steps"],
                    num_images_per_prompt=1,
                    generator=torch.Generator(device="cpu").manual_seed(item["seed"]),
                )
            frame = result.images[0]
            frame.save(destination)
            payload["status"] = "generated"
            payload["memory_mode_verified_on_this_gpu"] = True
            payload["output"] = str(destination)
            payload["output_size"] = list(frame.size)
            payload["seconds"] = round(time.perf_counter() - tick, 1)
            payload["peak_vram_bytes"] = torch.cuda.max_memory_allocated()
            payload["identity"] = identity_report(args.input, destination)
            if not payload["identity"]["colours_held"]:
                payload["status"] = "generated-colour-drift"
                exit_code = 4
        except torch.cuda.OutOfMemoryError as exc:
            torch.cuda.empty_cache()
            payload["status"] = "oom"
            payload["error"] = str(exc)
            payload["seconds"] = round(time.perf_counter() - tick, 1)
            write_json(sidecar, payload)
            print(f"Out of memory in {mode}. No retry was started. {destination}", file=sys.stderr)
            return 3
        write_json(sidecar, payload)
        print(payload["status"], destination, payload.get("seconds"))
    return exit_code


def main() -> int:
    parser = argparse.ArgumentParser(description="Edit the V8 beauty still with Qwen-Image-Edit-2511.")
    parser.add_argument("--input", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--reference", type=Path)
    parser.add_argument("--variant", choices=["conservative", "official", "reference", "all"], default="all")
    parser.add_argument("--memory", choices=["auto", "resident", "model-offload", "sequential"], default="auto")
    parser.add_argument("--dry-run", action="store_true", help="Print the plan. Do not import the model.")
    args = parser.parse_args()

    if not args.input.is_file():
        print(f"Input still is missing: {args.input}", file=sys.stderr)
        return 2
    if args.reference is not None and not args.reference.is_file():
        print(f"Reference image is missing: {args.reference}", file=sys.stderr)
        return 2
    try:
        variants = selected_variants(args.variant, args.reference)
    except ValueError as exc:
        print(exc, file=sys.stderr)
        return 2

    names = ", ".join(item["name"] for item in variants)
    try:
        import torch
    except ImportError:
        if args.dry_run:
            print(f"dry-run only. PyTorch is absent, so nothing was loaded. Variants: {names}")
            return 0
        print("PyTorch is not installed. Refusing to load Qwen-Image-Edit-2511.", file=sys.stderr)
        return 2
    if not torch.cuda.is_available():
        if args.dry_run:
            print(f"dry-run only. CUDA is absent, so nothing was loaded. Variants: {names}")
            return 0
        print("CUDA is not available. Refusing to load Qwen-Image-Edit-2511. No weights were downloaded.", file=sys.stderr)
        return 2

    vram_gb = torch.cuda.get_device_properties(0).total_memory / (1024**3)
    try:
        mode, note = choose_memory(vram_gb, args.memory)
    except ValueError as exc:
        print(exc, file=sys.stderr)
        return 2
    print(f"memory {mode}: {note}")
    print("variants:", ", ".join(item["name"] for item in variants))
    if args.dry_run:
        print("dry-run only. The model was not loaded.")
        return 0
    try:
        return run_inference(args, variants, mode, note)
    except Exception as exc:  # noqa: BLE001 — report the load failure and leave no partial claim
        print(f"Inference did not finish: {type(exc).__name__}: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
