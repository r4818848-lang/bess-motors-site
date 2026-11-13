"""Qwen-Image-Edit-2511 pass for one Blender hero still.

This file is the GPU recipe. On a machine without CUDA it exits before
downloading weights. It was not run on the CPU Cloud Agent that built V8.
"""

from __future__ import annotations

import argparse
import sys


PROMPT = (
    "Edit this studio photograph. Keep exactly three cars in the same places. "
    "Left car: saturated green automotive paint. Centre car: deep metallic royal blue. "
    "Right car: glossy burgundy. Keep the body shapes, wheel count, headlights, and stance. "
    "Improve clearcoat, glass, lamp detail, and the coloured floor reflections. "
    "Do not add vehicles, doors, wheels, or lamps. Do not change the colours."
)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True)
    parser.add_argument("--output", required=True)
    parser.add_argument("--steps", type=int, default=20)
    parser.add_argument("--seed", type=int, default=7)
    args = parser.parse_args()

    try:
        import torch
    except ImportError:
        print("PyTorch is not installed. Refusing to load Qwen-Image-Edit-2511.", file=sys.stderr)
        return 2

    if not torch.cuda.is_available():
        print("CUDA is not available. Refusing to load Qwen-Image-Edit-2511.", file=sys.stderr)
        return 2

    from diffusers import QwenImageEditPlusPipeline
    from PIL import Image

    pipe = QwenImageEditPlusPipeline.from_pretrained(
        "Qwen/Qwen-Image-Edit-2511",
        torch_dtype=torch.bfloat16,
    )
    pipe.to("cuda")
    image = Image.open(args.input).convert("RGB")
    result = pipe(
        image=[image],
        prompt=PROMPT,
        num_inference_steps=args.steps,
        generator=torch.Generator(device="cuda").manual_seed(args.seed),
    )
    frame = result.images[0]
    frame.save(args.output)
    print(args.output, frame.size)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
