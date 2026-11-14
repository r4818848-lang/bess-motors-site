"""Check the local SDXL workflows against ComfyUI 0.45 input order.

Slot numbers follow INPUT_TYPES, including widgets. This file does not load a
model and does not generate an image.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
WIDTH = 896
HEIGHT = 512
CANNY_TYPE = "canny/lineart/anime_lineart/mlsd"
DEPTH_TYPE = "depth"

# (name, type, is_link)
SPECS = {
    "LoadImage": {"inputs": [], "outputs": ["IMAGE", "MASK"]},
    "ImageScale": {
        "inputs": [
            ("image", "IMAGE", True),
            ("upscale_method", "COMBO", False),
            ("width", "INT", False),
            ("height", "INT", False),
            ("crop", "COMBO", False),
        ],
        "outputs": ["IMAGE"],
    },
    "Canny": {
        "inputs": [("image", "IMAGE", True), ("low_threshold", "FLOAT", False), ("high_threshold", "FLOAT", False)],
        "outputs": ["IMAGE"],
    },
    "CheckpointLoaderSimple": {"inputs": [], "outputs": ["MODEL", "CLIP", "VAE"]},
    "VAELoader": {"inputs": [], "outputs": ["VAE"]},
    "CLIPTextEncode": {
        "inputs": [("text", "STRING", False), ("clip", "CLIP", True)],
        "outputs": ["CONDITIONING"],
    },
    "ControlNetLoader": {"inputs": [], "outputs": ["CONTROL_NET"]},
    "SetUnionControlNetType": {
        "inputs": [("control_net", "CONTROL_NET", True), ("type", "COMBO", False)],
        "outputs": ["CONTROL_NET"],
    },
    "ControlNetApplyAdvanced": {
        "inputs": [
            ("positive", "CONDITIONING", True),
            ("negative", "CONDITIONING", True),
            ("control_net", "CONTROL_NET", True),
            ("image", "IMAGE", True),
            ("strength", "FLOAT", False),
            ("start_percent", "FLOAT", False),
            ("end_percent", "FLOAT", False),
            ("vae", "VAE", True),
        ],
        "outputs": ["CONDITIONING", "CONDITIONING"],
    },
    "VAEEncode": {
        "inputs": [("pixels", "IMAGE", True), ("vae", "VAE", True)],
        "outputs": ["LATENT"],
    },
    "KSampler": {
        "inputs": [
            ("model", "MODEL", True),
            ("seed", "INT", False),
            ("steps", "INT", False),
            ("cfg", "FLOAT", False),
            ("sampler_name", "COMBO", False),
            ("scheduler", "COMBO", False),
            ("positive", "CONDITIONING", True),
            ("negative", "CONDITIONING", True),
            ("latent_image", "LATENT", True),
            ("denoise", "FLOAT", False),
        ],
        "outputs": ["LATENT"],
    },
    "VAEDecode": {
        "inputs": [("samples", "LATENT", True), ("vae", "VAE", True)],
        "outputs": ["IMAGE"],
    },
    "SaveImage": {
        "inputs": [("images", "IMAGE", True), ("filename_prefix", "STRING", False)],
        "outputs": ["IMAGE"],
    },
}


def node(node_id, kind, widgets, pos):
    spec = SPECS[kind]
    return {
        "id": node_id,
        "type": kind,
        "pos": pos,
        "size": [340, 140],
        "flags": {},
        "order": node_id,
        "mode": 0,
        "inputs": [
            {"name": name, "type": typ, "link": None}
            for name, typ, is_link in spec["inputs"]
            if is_link
        ],
        "outputs": [
            {"name": f"out{index}", "type": typ, "slot_index": index, "links": []}
            for index, typ in enumerate(spec["outputs"])
        ],
        "properties": {"Node name for S&R": kind},
        "widgets_values": widgets,
    }


def slot(nodes, node_id, name):
    spec = SPECS[nodes[node_id]["type"]]
    for index, (input_name, _typ, is_link) in enumerate(spec["inputs"]):
        if input_name == name:
            if not is_link:
                raise SystemExit(f"{name} on {node_id} is a widget")
            return index
    raise SystemExit(f"{name} missing on node {node_id}")


def connect(link_id, src, src_slot, dst, dst_name, nodes, links):
    dst_slot = slot(nodes, dst, dst_name)
    produced = nodes[src]["outputs"][src_slot]["type"]
    spec = SPECS[nodes[dst]["type"]]["inputs"][dst_slot]
    if produced != spec[1]:
        raise SystemExit(f"link {link_id} {produced} != {spec[1]}")
    links.append([link_id, src, src_slot, dst, dst_slot, produced])
    nodes[src]["outputs"][src_slot]["links"].append(link_id)
    target = next(item for item in nodes[dst]["inputs"] if item["name"] == dst_name)
    target["link"] = link_id


def build(kind: str) -> dict:
    positive = (
        "professional automotive studio photograph of the same three cars, "
        "left car glossy green paint, centre car metallic royal blue paint, "
        "right car glossy burgundy paint, realistic clearcoat, glass, headlights on, "
        "coloured floor reflections, sharp wheels, correct stance"
    )
    negative = "extra car, extra wheel, deformed body, different car, text, logo, watermark, blurry, plastic toy"
    nodes = {
        1: node(1, "LoadImage", ["v8-beauty.png"], [40, 40]),
        2: node(2, "ImageScale", ["lanczos", WIDTH, HEIGHT, "disabled"], [420, 40]),
        4: node(4, "CheckpointLoaderSimple", ["sd_xl_base_1.0.safetensors"], [40, 280]),
        5: node(5, "VAELoader", ["sdxl_vae.safetensors"], [40, 480]),
        6: node(6, "CLIPTextEncode", [positive], [860, 40]),
        7: node(7, "CLIPTextEncode", [negative], [860, 260]),
        8: node(8, "ControlNetLoader", ["xinsir-controlnet-union-sdxl-promax.safetensors"], [40, 680]),
        9: node(9, "SetUnionControlNetType", [CANNY_TYPE if kind == "canny" else DEPTH_TYPE], [420, 680]),
        10: node(10, "ControlNetApplyAdvanced", [0.55, 0.0, 0.8], [1280, 220]),
        11: node(11, "VAEEncode", [], [860, 500]),
        12: node(12, "KSampler", [7, "fixed", 20, 5.5, "euler", "normal", 0.32], [1680, 220]),
        13: node(13, "VAEDecode", [], [2060, 220]),
        14: node(14, "SaveImage", [f"bess-v8-sdxl-{kind}"], [2400, 220]),
    }
    if kind == "canny":
        nodes[3] = node(3, "Canny", [0.35, 0.75], [860, 760])
    else:
        nodes[3] = node(3, "LoadImage", ["v8-depth.png"], [420, 900])
        nodes[15] = node(15, "ImageScale", ["lanczos", WIDTH, HEIGHT, "disabled"], [860, 900])
    links = []
    connect(1, 1, 0, 2, "image", nodes, links)
    connect(2, 2, 0, 11, "pixels", nodes, links)
    connect(3, 4, 1, 6, "clip", nodes, links)
    connect(4, 4, 1, 7, "clip", nodes, links)
    connect(5, 4, 0, 12, "model", nodes, links)
    connect(6, 5, 0, 11, "vae", nodes, links)
    connect(7, 5, 0, 13, "vae", nodes, links)
    connect(8, 5, 0, 10, "vae", nodes, links)
    connect(9, 8, 0, 9, "control_net", nodes, links)
    connect(10, 9, 0, 10, "control_net", nodes, links)
    connect(11, 6, 0, 10, "positive", nodes, links)
    connect(12, 7, 0, 10, "negative", nodes, links)
    connect(13, 10, 0, 12, "positive", nodes, links)
    connect(14, 10, 1, 12, "negative", nodes, links)
    connect(15, 11, 0, 12, "latent_image", nodes, links)
    connect(16, 12, 0, 13, "samples", nodes, links)
    connect(17, 13, 0, 14, "images", nodes, links)
    if kind == "canny":
        connect(18, 2, 0, 3, "image", nodes, links)
        connect(19, 3, 0, 10, "image", nodes, links)
    else:
        connect(18, 3, 0, 15, "image", nodes, links)
        connect(19, 15, 0, 10, "image", nodes, links)
    return {
        "id": f"bess-v8-sdxl-{kind}",
        "revision": 0,
        "last_node_id": max(nodes),
        "last_link_id": 19,
        "nodes": [nodes[key] for key in sorted(nodes)],
        "links": links,
        "groups": [],
        "config": {},
        "extra": {
            "note": "Local 8 GB experiment. Not an AI frame until this graph has been queued on the RTX 5060 Ti.",
            "comfyui": "0.45.0",
            "resolution": [WIDTH, HEIGHT],
            "denoise": 0.32,
            "control_strength": 0.55,
        },
        "version": 0.4,
    }


def check(graph: dict) -> None:
    nodes = {item["id"]: item for item in graph["nodes"]}
    for item in graph["links"]:
        link_id, src, src_slot, dst, dst_slot, typ = item
        if nodes[src]["outputs"][src_slot]["type"] != typ:
            raise SystemExit(f"bad source on {link_id}")
        spec = SPECS[nodes[dst]["type"]]["inputs"][dst_slot]
        if spec[1] != typ or not spec[2]:
            raise SystemExit(f"bad target slot {dst_slot} on {link_id}")
        if link_id not in nodes[src]["outputs"][src_slot]["links"]:
            raise SystemExit(f"source missing {link_id}")
        named = next(entry for entry in nodes[dst]["inputs"] if entry["name"] == spec[0])
        if named["link"] != link_id:
            raise SystemExit(f"target missing {link_id}")
    # KSampler keeps the frontend's fixed-seed widget between the seed and the step count.
    sampler = next(item for item in graph["nodes"] if item["type"] == "KSampler")
    if sampler["widgets_values"][1] != "fixed":
        raise SystemExit("sampler seed is not fixed")


def main() -> int:
    write = "--write" in sys.argv
    for kind in ("canny", "depth"):
        graph = build(kind)
        check(graph)
        path = HERE / "workflows" / f"v8-sdxl-{kind}.json"
        if write:
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text(json.dumps(graph, indent=2) + "\n")
        else:
            saved = json.loads(path.read_text())
            check(saved)
            if saved != graph:
                raise SystemExit(f"{path.name} drifted from the builder")
        print(f"{path.name} nodes={len(graph['nodes'])} links={len(graph['links'])}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
