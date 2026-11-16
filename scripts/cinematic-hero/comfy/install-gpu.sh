#!/usr/bin/env bash
# Install the Qwen-Image-Edit-2511 Python stack on a machine that already has an NVIDIA GPU.
# This script does not rent a server, does not download the 58 GB weights, and does not open a port.
set -euo pipefail

if ! command -v nvidia-smi >/dev/null 2>&1; then
  echo "nvidia-smi is missing. Refusing to install a CUDA stack on a CPU machine." >&2
  exit 2
fi

nvidia-smi -L

ROOT="$(cd "$(dirname "$0")" && pwd)"
VENV="${BESS_QWEN_VENV:-$HOME/bess-qwen-edit}"
python3 -m venv "$VENV"
# shellcheck disable=SC1091
source "$VENV/bin/activate"
python -m pip install --upgrade pip
# The default PyPI torch wheel is the CUDA build for Linux x86_64 when one is published.
# If pip installs a CPU wheel, stop before the weights are downloaded.
python -m pip install -r "$ROOT/requirements-gpu.txt"
python - << 'PY'
import torch
print("torch", torch.__version__, "cuda", torch.cuda.is_available())
if not torch.cuda.is_available():
    raise SystemExit("PyTorch does not see CUDA. The CPU wheel was installed. Do not download the weights.")
print("gpu", torch.cuda.get_device_name(0))
print("vram_gb", round(torch.cuda.get_device_properties(0).total_memory / (1024 ** 3), 2))
PY

echo
echo "Packages are installed in $VENV"
echo "Weights are not downloaded yet. On this same GPU machine, from the repository root:"
echo "  source \"$VENV/bin/activate\""
echo "  python3 scripts/cinematic-hero/comfy/edit_hero.py \\"
echo "    --input docs/review/v8-beauty.png \\"
echo "    --reference /path/to/the-studio-reference.png \\"
echo "    --output docs/review/v8-ai \\"
echo "    --variant all"
echo "Do not commit the Hugging Face cache or the virtualenv."
