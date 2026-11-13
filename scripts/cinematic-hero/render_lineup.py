"""Three-car studio animatic for the BESS hero.

G90 (JUST GAME, CC BY) arcs in from the right and stops in the center.
M4 Widebody (VTDAT23, CC BY) then arcs in from the left and stops behind-left.
M4 GT3 EVO (MattDoesBlender, CC BY) arrives last from the right and stops behind-right.
The VTX CC BY-NC-SA file is not imported. Blender 4.0 Eevee. Nose is local -Y, axle is local X.

  blender -b -P scripts/cinematic-hero/render_lineup.py -- --preview
  blender -b -P scripts/cinematic-hero/render_lineup.py -- --animatic --mobile
"""

import math
import os
import sys
import time
from pathlib import Path

import bpy
from mathutils import Matrix, Quaternion, Vector

G90_SRC = "/workspace/assets/hero/source/g90/bmw-g90-m5-justgame.glb"
M4_SRC = "/workspace/assets/hero/source/m4-widebody/bmw-m4-widebody.glb"
GT3_SRC = "/workspace/assets/hero/source/gt3-ccby/bmw-m4-gt3-evo-mattdoesblender.glb"
# Forbidden in this shot: assets/hero/source/m4-gt3/bmw-m4-gt3-evo.glb (CC BY-NC-SA).

G90_FRONT = ("WHEEL_LF", "WHEEL_RF")
G90_REAR = ("WHEEL_LR", "WHEEL_RR")
M4_FRONT = ("TIRE_LF_45", "TIRE_RF_43")
M4_REAR = ("TIRE_LR_44", "TIRE_RR_42")

# Headings are degrees. 0 looks down -Y (toward the camera). Negative turns the
# nose toward screen-left. The end heading is the tangent, so the car does not crab.
# Parked body gaps are about 0.85 m: one group, not three separate cars.
G90_PATH = {
    "p0": (9.2, 1.6),
    "h0": -82.0,
    "p3": (0.05, 0.0),
    "h3": -38.0,
    "l1": 4.8,
    "l2": 3.6,
    "t0": 0.15,
    "t1": 3.35,
}
M4_PATH = {
    "p0": (-10.2, 1.4),
    "h0": 62.0,
    "p3": (-2.45, 1.55),
    "h3": -22.0,
    "l1": 4.2,
    "l2": 3.0,
    "t0": 3.55,
    "t1": 6.05,
}
GT3_PATH = {
    "p0": (11.4, 5.2),
    "h0": -74.0,
    "p3": (3.35, 1.75),
    "h3": -44.0,
    "l1": 4.6,
    "l2": 2.8,
    "t0": 6.25,
    "t1": 8.45,
}
DURATION = 9.0
FPS = 24
RENDER_FLAGS = set()


def v4_requested():
    """True for --v4 and every --v4-* still. Substring checks miss --v4-desktop."""
    return any(flag == "--v4" or flag.startswith("--v4-") for flag in RENDER_FLAGS)


def v8_requested():
    """New reference: green M4, metallic blue G90, burgundy GT3."""
    return any(flag == "--v8" or flag.startswith("--v8") for flag in RENDER_FLAGS)


def v7_requested():
    return v8_requested() or any(flag == "--v7" or flag.startswith("--v7") for flag in RENDER_FLAGS)


def v6_requested():
    return v7_requested() or any(flag == "--v6" or flag.startswith("--v6") for flag in RENDER_FLAGS)


def v5_requested():
    # "--v51" does not start with "--v5-", so match the whole v5 family.
    # v6 keeps the planted stance and the neutral GT3 paint path.
    return v6_requested() or any(flag == "--v5" or flag.startswith("--v5") for flag in RENDER_FLAGS)


def use_v6_parks():
    """A tight row. Mesh packing pushes a corner back out if it clips."""
    global DURATION
    if not v6_requested():
        return
    G90_PATH["p3"] = (0.0, -0.15)
    G90_PATH["h3"] = -18.0
    G90_PATH["l2"] = 3.0
    M4_PATH["p3"] = (-2.45, 0.05)
    M4_PATH["h3"] = -10.0
    # A longer straight finish. The old short handle rotated the nose through the red car.
    M4_PATH["l2"] = 4.8
    M4_PATH["side"] = 0.0
    GT3_PATH["p3"] = (2.55, 0.08)
    GT3_PATH["h3"] = -14.0
    GT3_PATH["l2"] = 2.2
    if v7_requested():
        # Side cars sit a little behind the hero. Packing still opens a real mesh gap.
        M4_PATH["p3"] = (-2.28, 0.18)
        GT3_PATH["p3"] = (2.36, 0.2)
        G90_PATH["t0"] = 0.2
        G90_PATH["t1"] = 3.5
        M4_PATH["t0"] = 3.5
        M4_PATH["t1"] = 6.2
        GT3_PATH["t0"] = 6.2
        GT3_PATH["t1"] = 9.0
        DURATION = 12.0


def srgb_to_linear(hex_color):
    """Blender paints in linear. A hex swatch has to be converted or it goes dull."""
    value = hex_color.lstrip("#")
    channels = [int(value[index : index + 2], 16) / 255.0 for index in (0, 2, 4)]

    def convert(channel):
        if channel <= 0.04045:
            return channel / 12.92
        return ((channel + 0.055) / 1.055) ** 2.4

    return tuple(convert(channel) for channel in channels)


def clear():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete()


def forward(deg):
    rad = math.radians(deg)
    return Vector((math.sin(rad), -math.cos(rad), 0.0))


def smooth(u):
    u = min(1.0, max(0.0, u))
    return u * u * (3.0 - 2.0 * u)


def shaped(u):
    """Distance fraction. Enters with pace, brakes to a stop."""
    if u <= 0.0:
        return 0.0
    if u >= 1.0:
        return 1.0
    if u < 0.16:
        return 0.12 * smooth(u / 0.16)
    if u < 0.52:
        return 0.12 + 0.56 * ((u - 0.16) / 0.36)
    return 0.68 + 0.32 * (1.0 - (1.0 - (u - 0.52) / 0.48) ** 3)


def look_at(obj, target):
    obj.rotation_euler = (target - obj.location).to_track_quat("-Z", "Y").to_euler()


def parent_keep(child, parent):
    world = child.matrix_world.copy()
    child.parent = parent
    child.matrix_world = world


def bsdf(mat):
    if not mat or not mat.use_nodes:
        return None
    return next((node for node in mat.node_tree.nodes if node.type == "BSDF_PRINCIPLED"), None)


def paint(name, color, metallic, roughness, coat=1.0, coat_rough=0.03):
    """Automotive paint is a dielectric under clearcoat, not a metal shader."""
    node = bsdf(bpy.data.materials.get(name))
    if node is None:
        return
    if "Base Color" in node.inputs and not node.inputs["Base Color"].is_linked:
        node.inputs["Base Color"].default_value = (*color, 1.0)
    node.inputs["Metallic"].default_value = metallic
    if not node.inputs["Roughness"].is_linked:
        node.inputs["Roughness"].default_value = roughness
    if "Coat Weight" in node.inputs:
        node.inputs["Coat Weight"].default_value = coat
    if "Coat Roughness" in node.inputs:
        node.inputs["Coat Roughness"].default_value = coat_rough
    if "Specular IOR Level" in node.inputs and not node.inputs["Specular IOR Level"].is_linked:
        node.inputs["Specular IOR Level"].default_value = 0.5
    if "Emission Strength" in node.inputs and not node.inputs["Emission Strength"].is_linked:
        node.inputs["Emission Strength"].default_value = 0.0


class Curve:
    def __init__(self, spec):
        f0 = forward(spec["h0"])
        f3 = forward(spec["h3"])
        p0 = Vector((spec["p0"][0], spec["p0"][1], 0.0))
        p3 = Vector((spec["p3"][0], spec["p3"][1], 0.0))
        p1 = p0 + f0 * spec["l1"]
        p2 = p3 - f3 * spec["l2"]
        # Positive side is to the car's right. The M4 bows out to its left so the arc misses the red car.
        if spec.get("side"):
            right = Vector((-f3.y, f3.x, 0.0))
            p2 = p2 + right * spec["side"]
        pts = []
        for i in range(241):
            t = i / 240.0
            u = 1.0 - t
            pts.append((u ** 3) * p0 + (3 * u * u * t) * p1 + (3 * u * t * t) * p2 + (t ** 3) * p3)
        self.pts = pts
        self.s = [0.0]
        for a, b in zip(pts, pts[1:]):
            self.s.append(self.s[-1] + (b - a).length)
        self.total = self.s[-1]
        self.t0 = spec["t0"]
        self.t1 = spec["t1"]

    def sample(self, distance):
        distance = min(self.total, max(0.0, distance))
        hi = len(self.s) - 1
        lo = 0
        while lo < hi:
            mid = (lo + hi) // 2
            if self.s[mid] < distance:
                lo = mid + 1
            else:
                hi = mid
        i = max(1, lo)
        span = self.s[i] - self.s[i - 1] or 1e-6
        frac = (distance - self.s[i - 1]) / span
        pos = self.pts[i - 1].lerp(self.pts[i], frac)
        tangent = (self.pts[min(i + 1, len(self.pts) - 1)] - self.pts[max(i - 2, 0)])
        if tangent.length < 1e-8:
            tangent = Vector((0.0, -1.0, 0.0))
        tangent.normalize()
        yaw = math.atan2(tangent.x, -tangent.y)
        prev = self.pts[max(i - 3, 0)]
        nxt = self.pts[min(i + 3, len(self.pts) - 1)]
        y0 = math.atan2((self.pts[i] - prev).x, -(self.pts[i] - prev).y) if (self.pts[i] - prev).length > 1e-6 else yaw
        y1 = math.atan2((nxt - self.pts[i]).x, -(nxt - self.pts[i]).y) if (nxt - self.pts[i]).length > 1e-6 else yaw
        dy = y1 - y0
        while dy > math.pi:
            dy -= 2 * math.pi
        while dy < -math.pi:
            dy += 2 * math.pi
        ds = (nxt - prev).length or 1e-6
        curvature = dy / ds
        return pos, yaw, curvature

    def distance_at(self, t):
        if t <= self.t0:
            return 0.0
        if t >= self.t1:
            return self.total
        u = (t - self.t0) / (self.t1 - self.t0)
        return shaped(u) * self.total

    def at_time(self, t):
        return self.sample(self.distance_at(t))


def import_new(path):
    before = set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=path)
    return [obj for obj in bpy.data.objects if obj not in before]


def make_rig(new_objects, name):
    rig = bpy.data.objects.new(name, None)
    bpy.context.scene.collection.objects.link(rig)
    rig.location = (0.0, 0.0, 0.40)
    bpy.context.view_layer.update()
    for obj in new_objects:
        if obj.parent is None and obj != rig:
            parent_keep(obj, rig)
    bpy.context.view_layer.update()
    return rig


def drop_junk(objects):
    for obj in objects:
        if obj.type in {"LIGHT", "CAMERA"} or obj.name.startswith("Cube"):
            bpy.data.objects.remove(obj, do_unlink=True)


STAY_HIDDEN = set()


def hide_orbiting_duplicates(wheel_names):
    """Some glTF nodes parent a second rim to the wrong hub and park it with an offset.

    Spinning the hub then swings that rim off the car. The real rim is the one
    whose bounds sit on the hub, so the offset copy stays hidden.
    """
    for name in wheel_names:
        hub = bpy.data.objects.get(name)
        if hub is None:
            continue
        origin = hub.matrix_world.translation
        for obj in bpy.context.scene.objects:
            if obj.type != "MESH":
                continue
            parent = obj.parent
            under = False
            while parent is not None:
                if parent == hub:
                    under = True
                    break
                parent = parent.parent
            if not under:
                continue
            center = sum((obj.matrix_world @ Vector(corner) for corner in obj.bound_box), Vector()) / 8.0
            if (center - origin).length > 0.85:
                obj.hide_render = True
                STAY_HIDDEN.add(obj)


def hide_tree(rig, hidden):
    for obj in bpy.context.scene.objects:
        parent = obj
        while parent is not None and parent != rig:
            parent = parent.parent
        if parent == rig:
            obj.hide_render = True if obj in STAY_HIDDEN else hidden


def tire_bottom(names):
    low = 1e9
    hubs = [bpy.data.objects[name] for name in names]
    for obj in bpy.context.scene.objects:
        if obj.type != "MESH":
            continue
        parent = obj.parent
        while parent is not None and parent not in hubs:
            parent = parent.parent
        if parent not in hubs:
            continue
        for corner in obj.bound_box:
            low = min(low, (obj.matrix_world @ Vector(corner)).z)
    return low


def wheel_radius(name):
    hub = bpy.data.objects[name]
    low = 1e9
    high = -1e9
    for obj in bpy.context.scene.objects:
        if obj.type != "MESH":
            continue
        parent = obj.parent
        while parent is not None and parent != hub:
            parent = parent.parent
        if parent != hub:
            continue
        for corner in obj.bound_box:
            z = (obj.matrix_world @ Vector(corner)).z
            low = min(low, z)
            high = max(high, z)
    if high <= low:
        return 0.36
    return (high - low) * 0.5


def spin_wheel(obj, rest, roll, steer):
    obj.rotation_mode = "QUATERNION"
    obj.rotation_quaternion = rest @ Quaternion((0.0, 0.0, 1.0), steer) @ Quaternion((1.0, 0.0, 0.0), roll)


def add_spots(rig, prefix):
    spots = []
    # v7 aims the beam at lamp height. A downward aim painted white bars on the floor.
    aim = Vector((0.0, -1.0, 0.38 if v7_requested() else -0.02)).to_track_quat("-Z", "Y").to_euler()
    for side, x in (("L", 0.72), ("R", -0.72)):
        light = bpy.data.lights.new(f"{prefix}_{side}", "SPOT")
        light.energy = 0.0
        light.spot_size = math.radians(16 if v7_requested() else 18)
        light.spot_blend = 0.85 if v7_requested() else 0.6
        light.color = (0.86, 0.91, 1.0)
        light.use_shadow = False
        obj = bpy.data.objects.new(light.name, light)
        bpy.context.scene.collection.objects.link(obj)
        obj.parent = rig
        obj.matrix_parent_inverse = Matrix.Identity(4)
        obj.location = Vector((x, -2.05, 0.62))
        obj.rotation_mode = "XYZ"
        obj.rotation_euler = aim
        spots.append(light)
    return spots


def segment(pos, yaw, half=2.45):
    f = Vector((math.sin(yaw), -math.cos(yaw)))
    return pos.xy - f * half, pos.xy + f * half


def segment_gap(a, b):
    best = 1e9
    for i in range(8):
        p = a[0].lerp(a[1], i / 7.0)
        for j in range(8):
            q = b[0].lerp(b[1], j / 7.0)
            best = min(best, (p - q).length)
    return best


def studio(floor_z, receivers=None):
    """Dark cove. Wide softboxes shape the paint. A dim overhead casts the contact shadow.

    The softboxes are linked to the cars when Blender allows it, so they do not
    turn the floor into a white sheet.
    """
    world = bpy.data.worlds.new("Studio")
    bpy.context.scene.world = world
    world.use_nodes = True
    nodes = world.node_tree.nodes
    links = world.node_tree.links
    nodes.clear()
    out = nodes.new("ShaderNodeOutputWorld")
    bg = nodes.new("ShaderNodeBackground")
    geom = nodes.new("ShaderNodeNewGeometry")
    sep = nodes.new("ShaderNodeSeparateXYZ")
    ramp = nodes.new("ShaderNodeValToRGB")
    ramp.color_ramp.elements[0].position = 0.22
    ramp.color_ramp.elements[0].color = (0.012, 0.013, 0.015, 1.0)
    ramp.color_ramp.elements[1].position = 0.78
    ramp.color_ramp.elements[1].color = (0.045, 0.048, 0.054, 1.0)
    links.new(geom.outputs["Incoming"], sep.inputs["Vector"])
    links.new(sep.outputs["Z"], ramp.inputs["Fac"])
    links.new(ramp.outputs["Color"], bg.inputs["Color"])
    bg.inputs["Strength"].default_value = (
        0.9 if v7_requested() else (0.62 if v6_requested() else (0.28 if v5_requested() else 0.12))
    )
    links.new(bg.outputs["Background"], out.inputs["Surface"])

    bpy.ops.mesh.primitive_plane_add(size=160, location=(0.0, 4.0, floor_z))
    floor = bpy.context.active_object
    floor.name = "Floor"
    mat = bpy.data.materials.new("Floor")
    mat.use_nodes = True
    node = mat.node_tree.nodes["Principled BSDF"]
    if v7_requested():
        # Dark enough to stay a studio, glossy enough for the coloured pools to read.
        node.inputs["Base Color"].default_value = (0.045, 0.046, 0.050, 1.0)
        # Glossy enough that the coloured light stretches toward the camera, as on the reference floor.
        node.inputs["Roughness"].default_value = 0.18
        node.inputs["Specular IOR Level"].default_value = 0.58
    elif v6_requested():
        node.inputs["Base Color"].default_value = (0.078, 0.080, 0.086, 1.0)
        node.inputs["Roughness"].default_value = 0.55
        node.inputs["Specular IOR Level"].default_value = 0.36
    elif v5_requested():
        node.inputs["Base Color"].default_value = (0.055, 0.056, 0.060, 1.0)
        node.inputs["Roughness"].default_value = 0.42
        node.inputs["Specular IOR Level"].default_value = 0.42
    else:
        node.inputs["Base Color"].default_value = (0.012, 0.0125, 0.014, 1.0)
        node.inputs["Roughness"].default_value = 0.48
        node.inputs["Specular IOR Level"].default_value = 0.28
    node.inputs["Metallic"].default_value = 0.0
    floor.data.materials.append(mat)

    def area(name, location, energy, color, size, aim, shadow=False, link=False, size_y=None):
        light = bpy.data.lights.new(name, "AREA")
        light.energy = energy
        light.color = color
        light.shape = "RECTANGLE" if size_y else "SQUARE"
        light.size = size
        if size_y:
            light.size_y = size_y
        light.use_shadow = shadow
        obj = bpy.data.objects.new(name, light)
        bpy.context.scene.collection.objects.link(obj)
        obj.location = location
        look_at(obj, aim)
        if link and receivers:
            col = bpy.data.collections.new(f"{name}Rx")
            bpy.context.scene.collection.children.link(col)
            col.hide_render = False
            for item in receivers:
                try:
                    col.objects.link(item)
                except RuntimeError:
                    pass
            try:
                obj.light_linking.receiver_collection = col
                print("LIGHTLINK", name, len(col.objects))
            except (AttributeError, TypeError) as exc:
                print("LIGHTLINK unavailable", name, exc)

    aim = Vector((0.35, 1.15, 0.7))
    if v7_requested():
        # Long banks in front of the noses. The key is not above the roofs.
        area("Key", Vector((-1.6, -9.6, 2.15)), 320, (1.0, 0.98, 0.95), 9.0, Vector((0.15, 0.25, 0.72)), size_y=1.7, link=True)
        area("Fill", Vector((4.4, -7.2, 1.55)), 180, (0.86, 0.9, 1.0), 6.2, Vector((0.5, 0.3, 0.55)), size_y=2.2, link=True)
        area("Face", Vector((0.15, -6.2, 0.85)), 90, (1.0, 0.98, 0.96), 5.4, Vector((0.2, 0.4, 0.48)), size_y=0.7, link=True)
        area("RimL", Vector((-5.4, 2.2, 1.45)), 190, (0.7, 0.98, 0.8), 2.6, Vector((-1.6, 0.35, 0.6)), size_y=1.4, link=True)
        area("RimR", Vector((5.8, 2.6, 1.6)), 260, (1.0, 0.94, 0.92), 2.2, Vector((1.7, 0.4, 0.68)), size_y=1.6, link=True)
        area("Edge", Vector((1.4, 6.4, 2.05)), 200, (0.97, 0.97, 1.0), 1.4, Vector((0.35, 0.45, 0.82)), size_y=3.4, link=True)
        area("Wheel", Vector((0.05, -3.8, 0.32)), 55, (1.0, 0.97, 0.92), 5.0, Vector((0.1, 0.4, 0.22)), size_y=0.4, link=True)
        area("Top", Vector((0.15, 0.5, 8.4)), 36, (0.96, 0.97, 1.0), 14.0, Vector((0.15, 0.3, 0.0)), shadow=True)
        if v8_requested():
            # Thin coloured tubes behind the trio, matching the reference neon, not a floor slab.
            area("NeonL", Vector((-4.4, 2.4, 1.35)), 110, srgb_to_linear("18F06A"), 0.14, Vector((-1.7, 0.25, 0.65)), size_y=2.8)
            area("NeonC", Vector((0.15, 5.2, 1.6)), 100, srgb_to_linear("2F74FF"), 0.14, Vector((0.15, 0.35, 0.7)), size_y=3.0)
            area("NeonR", Vector((4.6, 2.5, 1.35)), 120, srgb_to_linear("E01430"), 0.14, Vector((1.8, 0.25, 0.65)), size_y=2.8)
    elif v6_requested():
        # Wide banks in front of the noses, plus a hard rim so the black car separates.
        area("Key", Vector((-2.8, -8.4, 2.7)), 240, (1.0, 0.97, 0.93), 7.2, Vector((0.1, 0.2, 0.62)), size_y=2.6, link=True)
        area("Fill", Vector((3.8, -7.4, 1.9)), 130, (0.84, 0.89, 1.0), 5.6, Vector((0.4, 0.35, 0.5)), size_y=2.4, link=True)
        area("RimL", Vector((-5.2, 2.4, 1.55)), 160, (0.72, 0.95, 0.82), 2.4, Vector((-1.5, 0.4, 0.62)), size_y=1.3, link=True)
        area("RimR", Vector((5.6, 2.8, 1.7)), 210, (1.0, 0.93, 0.9), 1.8, Vector((1.6, 0.45, 0.7)), size_y=1.5, link=True)
        area("Edge", Vector((1.6, 6.2, 2.15)), 170, (0.96, 0.96, 1.0), 1.2, Vector((0.4, 0.5, 0.85)), size_y=3.2, link=True)
        area("Wheel", Vector((0.1, -4.2, 0.28)), 36, (1.0, 0.96, 0.9), 4.2, Vector((0.1, 0.3, 0.2)), size_y=0.45, link=True)
        area("Top", Vector((0.15, 0.6, 7.2)), 48, (0.96, 0.97, 1.0), 12.0, Vector((0.15, 0.3, 0.0)), shadow=True)
    elif v5_requested():
        # Long banks shape the panels. A low strip lifts the wheels out of the black.
        # The key sits in front of the noses, not above the roofs, so the GT3 glass
        # gets a long hood reflection instead of a white panel.
        area("Key", Vector((-0.6, -11.2, 2.55)), 180, (1.0, 0.97, 0.93), 14.0, Vector((0.4, 0.6, 0.55)), size_y=1.8, link=True)
        area("Fill", Vector((3.6, -9.2, 1.45)), 150, (0.9, 0.93, 1.0), 7.0, Vector((1.2, 1.0, 0.55)), size_y=2.6, link=True)
        area("Wheel", Vector((0.4, -5.2, 0.38)), 32, (1.0, 0.97, 0.94), 5.5, Vector((0.4, 1.1, 0.28)), size_y=0.7, link=True)
        area("RimL", Vector((-6.8, 2.2, 1.55)), 90, (0.78, 0.9, 0.84), 3.4, Vector((-2.2, 1.4, 0.62)), size_y=1.1, link=True)
        area("RimR", Vector((7.6, 4.4, 1.7)), 70, (0.95, 0.94, 0.98), 3.2, Vector((3.8, 2.1, 0.72)), size_y=1.0, link=True)
        area("NoseR", Vector((5.4, -2.2, 0.85)), 55, (0.96, 0.97, 1.0), 2.4, Vector((3.3, 1.4, 0.42)), size_y=0.9, link=True)
        area("Top", Vector((0.6, 2.4, 9.5)), 28, (0.96, 0.97, 1.0), 18.0, Vector((0.6, 1.4, 0.0)), shadow=True)
    else:
        area("Key", Vector((-4.4, -4.6, 4.4)), 150, (1.0, 0.97, 0.94), 7.2, aim, size_y=3.8, link=True)
        area("Fill", Vector((3.8, -2.8, 2.1)), 110, (0.86, 0.9, 0.98), 6.0, aim, size_y=3.2, link=True)
        area("RimL", Vector((-5.6, 4.2, 1.9)), 150, (0.82, 0.88, 1.0), 3.6, Vector((-2.2, 1.6, 0.85)), size_y=1.8, link=True)
        area("RimR", Vector((7.2, 4.0, 2.0)), 140, (1.0, 0.94, 0.88), 3.6, Vector((4.2, 1.8, 0.85)), size_y=1.8, link=True)
        area("Face", Vector((0.2, -6.8, 1.35)), 70, (1.0, 0.98, 0.95), 5.0, aim, link=True)
        area("Top", Vector((0.3, 1.4, 7.2)), 55, (0.95, 0.96, 1.0), 8.0, Vector((0.3, 1.2, 0.2)), shadow=True)

    cam_data = bpy.data.cameras.new("HeroCam")
    cam_data.lens = 35
    cam = bpy.data.objects.new("HeroCam", cam_data)
    bpy.context.scene.collection.objects.link(cam)
    bpy.context.scene.camera = cam
    frame_camera("desktop")
    return cam


def aim_nearest_front(car):
    hubs = [obj.matrix_world.translation.copy() for obj in car["front"]]
    origin = min(hubs, key=lambda point: point.y)
    cam = bpy.data.objects["HeroCam"]
    cam.data.lens = 48
    cam.data.shift_x = 0.0
    cam.data.shift_y = 0.0
    cam.location = origin + Vector((0.02, -1.28, 0.2))
    look_at(cam, origin + Vector((0.0, 0.0, 0.02)))


def aim_g90_detail(car):
    """Paint, side glass, and the near front wheel in one frame."""
    hubs = [obj.matrix_world.translation.copy() for obj in car["front"]]
    origin = min(hubs, key=lambda point: point.y)
    cam = bpy.data.objects["HeroCam"]
    cam.data.lens = 65
    cam.data.shift_x = 0.0
    cam.data.shift_y = 0.0
    cam.location = origin + Vector((-0.15, -1.85, 0.62))
    look_at(cam, origin + Vector((0.22, 0.45, 0.42)))


def aim_front(car, side_scale, lens):
    """Front corner: lamp, paint, and the near wheel. The look point is the nose, not the cabin."""
    origin = car["rig"].matrix_world.translation
    yaw = car["curve"].at_time(DURATION)[1]
    ahead = Vector((math.sin(yaw), -math.cos(yaw), 0.0))
    side = Vector((math.cos(yaw), math.sin(yaw), 0.0))
    nose = origin + ahead * 1.85 + Vector((0.0, 0.0, 0.52))
    cam = bpy.data.objects["HeroCam"]
    cam.data.lens = lens
    cam.data.shift_x = 0.0
    cam.data.shift_y = 0.0
    cam.location = nose + ahead * 2.15 + side * side_scale + Vector((0.0, 0.0, 0.4 if v7_requested() else 0.22))
    look_at(cam, nose + side * (0.22 if side_scale > 0 else -0.22) + Vector((0.0, 0.0, -0.08)))


def aim_beauty(car, offset, look, lens):
    origin = car["rig"].matrix_world.translation
    cam = bpy.data.objects["HeroCam"]
    cam.data.lens = lens
    cam.data.shift_x = 0.0
    cam.data.shift_y = 0.0
    cam.location = origin + Vector(offset)
    look_at(cam, origin + Vector(look))


def show_contacts(cars, visible):
    """Diagnostic only. Beauty frames leave the floor unmarked."""
    for obj in list(bpy.data.objects):
        if obj.name.startswith("ContactMark"):
            obj.hide_render = not visible
    if not visible:
        floor = bpy.data.materials.get("Floor")
        if floor is not None:
            bsdf = floor.node_tree.nodes["Principled BSDF"]
            for link in list(bsdf.inputs["Base Color"].links):
                floor.node_tree.links.remove(link)
            bsdf.inputs["Base Color"].default_value = (0.055, 0.056, 0.060, 1.0)
        return
    if bpy.data.objects.get("ContactMark0") is not None:
        return
    mat = bpy.data.materials.new("ContactEmit")
    mat.use_nodes = True
    node = mat.node_tree.nodes["Principled BSDF"]
    node.inputs["Emission Color"].default_value = (1.0, 0.35, 0.08, 1.0)
    node.inputs["Emission Strength"].default_value = 12.0
    floor = bpy.data.materials.get("Floor")
    if floor is not None:
        nodes = floor.node_tree.nodes
        links = floor.node_tree.links
        checker = nodes.new("ShaderNodeTexChecker")
        checker.inputs["Scale"].default_value = 80.0
        checker.inputs["Color1"].default_value = (0.11, 0.11, 0.12, 1.0)
        checker.inputs["Color2"].default_value = (0.2, 0.2, 0.21, 1.0)
        links.new(checker.outputs["Color"], nodes["Principled BSDF"].inputs["Base Color"])
    index = 0
    for car in cars:
        for hub in car["front"] + car["rear"]:
            low, point = contact_near_hub(hub)
            if low > 1e8:
                continue
            bpy.ops.mesh.primitive_uv_sphere_add(radius=0.05, location=(point.x, point.y, 0.05))
            mark = bpy.context.active_object
            mark.name = f"ContactMark{index}"
            mark.data.materials.append(mat)
            index += 1
            print(
                f"CONTACT {car['rig'].name} {hub.name} z={low:.4f} "
                f"xy=({point.x:.2f},{point.y:.2f})"
            )


def frame_camera(kind):
    cam = bpy.data.objects["HeroCam"]
    cam.data.shift_x = 0.0
    cam.data.shift_y = 0.0
    cam.data.sensor_fit = "HORIZONTAL"
    if kind == "ground":
        cam.data.lens = 48
        cam.location = Vector((-0.15, -9.6, 2.35))
        look_at(cam, Vector((0.35, 1.15, 0.12)))
    elif kind == "glow":
        cam.data.lens = 42
        cam.location = Vector((0.05, -5.6, 0.22))
        look_at(cam, Vector((0.15, 0.8, 0.12)))
    elif kind == "lamps":
        cam.data.lens = 50
        cam.location = Vector((0.15, -6.6, 0.52))
        look_at(cam, Vector((0.25, 0.15, 0.44)))
    elif kind == "beauty" and v7_requested():
        cam.data.lens = 40
        cam.location = Vector((0.08, -9.8, 0.64))
        look_at(cam, Vector((0.12, 0.35, 0.4)))
    elif kind == "wide" and v7_requested():
        cam.data.lens = 36
        cam.data.shift_x = -0.02
        cam.location = Vector((-0.05, -7.6, 0.55))
        look_at(cam, Vector((0.15, 0.45, 0.36)))
    elif kind == "beauty" and v6_requested():
        cam.data.lens = 58
        cam.location = Vector((-0.15, -9.6, 0.86))
        look_at(cam, Vector((0.05, 0.15, 0.46)))
    elif kind == "wide" and v6_requested():
        cam.data.lens = 42
        cam.data.shift_x = -0.06
        cam.location = Vector((-0.35, -8.8, 0.74))
        look_at(cam, Vector((0.05, 0.2, 0.42)))
    elif kind == "wide" and v5_requested():
        # 16:9 frame for the phone block. The portrait still stays a separate file.
        cam.data.lens = 44
        cam.data.shift_x = -0.14
        cam.location = Vector((-0.85, -12.6, 0.84))
        look_at(cam, Vector((1.15, 1.45, 0.52)))
    elif kind == "gt3side" and v5_requested():
        cam.data.lens = 70
        cam.location = Vector((7.4, -2.2, 0.62))
        look_at(cam, Vector((3.35, 1.75, 0.48)))
    elif kind == "mobile" and v5_requested():
        # Far enough that the outer cars keep a margin. Eye height puts them mid-frame.
        cam.data.lens = 42
        cam.data.shift_y = -0.08
        cam.location = Vector((0.15, -11.8, 0.82))
        look_at(cam, Vector((0.45, 1.25, 0.62)))
    elif kind == "mobile":
        cam.data.lens = 28
        cam.data.shift_x = -0.08
        cam.data.shift_y = 0.14
        cam.location = Vector((-1.05, -7.15, 1.02))
        look_at(cam, Vector((0.7, 1.45, 0.58)))
    elif kind == "gt3":
        cam.data.lens = 48
        cam.location = Vector((1.4, -2.4, 0.92))
        look_at(cam, Vector((5.15, 2.55, 0.62)))
    elif kind == "wheels":
        cam.data.lens = 30
        cam.location = Vector((-0.15, -7.6, 0.72))
        look_at(cam, Vector((0.35, 1.2, 0.42)))
    elif kind == "detail":
        cam.data.lens = 65
        cam.location = Vector((-0.4, -2.4, 0.85))
        look_at(cam, Vector((0.2, 0.4, 0.55)))
    elif v7_requested():
        # Left third stays empty for the headline. The group sits right, still fully in frame.
        # The Polish block is about a third of the viewport. Keep the cars to the right of it.
        cam.data.lens = 40
        cam.data.shift_x = -0.30
        cam.location = Vector((0.15, -14.2, 0.78))
        look_at(cam, Vector((1.45, 0.42, 0.4)))
    elif v6_requested():
        # The Polish headline needs the left third empty. Wider lens, then a shift, so the black car stays in frame.
        cam.data.lens = 40
        cam.data.shift_x = -0.20
        cam.location = Vector((-0.15, -15.8, 1.05))
        look_at(cam, Vector((1.05, 0.45, 0.5)))
    elif v5_requested():
        # 48 mm. Pulled back so the GT3 is inside the frame and the left stays clear.
        cam.data.lens = 50
        cam.data.shift_x = -0.20
        cam.location = Vector((-2.6, -20.4, 1.04))
        look_at(cam, Vector((1.15, 1.3, 0.58)))
    else:
        cam.data.lens = 28
        cam.data.shift_x = -0.24
        cam.location = Vector((-2.4, -12.4, 1.2))
        look_at(cam, Vector((1.35, 1.5, 0.58)))


def meshes_under(hubs):
    found = []
    for obj in bpy.context.scene.objects:
        if obj.type != "MESH" or obj.hide_render:
            continue
        parent = obj.parent
        while parent is not None and parent not in hubs:
            parent = parent.parent
        if parent in hubs:
            found.append(obj)
    return found


def lowest_point(objects):
    low = 1e9
    point = Vector((0.0, 0.0, 0.0))
    for obj in objects:
        for vertex in obj.data.vertices:
            world = obj.matrix_world @ vertex.co
            if world.z < low:
                low = world.z
                point = world
    return low, point


def contact_near_hub(hub):
    """Lowest vertex of the tire, not a splitter that happens to share the axle empty."""
    origin = hub.matrix_world.translation
    low = 1e9
    point = origin.copy()
    for obj in meshes_under([hub]):
        for vertex in obj.data.vertices:
            world = obj.matrix_world @ vertex.co
            if (world.xy - origin.xy).length > 0.24:
                continue
            if world.z < low:
                low = world.z
                point = world
    return low, point


def axle_low(hubs):
    lows = [contact_near_hub(hub)[0] for hub in hubs]
    lows = [value for value in lows if value < 1e8]
    return min(lows) if lows else 1e9


def side_contact(car, positive):
    inverse = car["rig"].matrix_world.inverted()
    lows = []
    for hub in car["front"] + car["rear"]:
        local_x = (inverse @ hub.matrix_world.translation).x
        if (local_x > 0.05) != positive:
            continue
        low, _point = contact_near_hub(hub)
        if low < 1e8:
            lows.append(low)
    return min(lows) if lows else 1e9


def plant_car(car, radius, wheelbase):
    """Level pitch and roll, then put the lowest tire on the floor."""
    car["pitch_bias"] = 0.0
    car["roll_bias"] = 0.0
    place(car, DURATION, radius, wheelbase)
    bpy.context.view_layer.update()
    roll_bias = 0.0
    for _ in range(6):
        left = side_contact(car, True)
        right = side_contact(car, False)
        error = left - right
        print(f"ROLL {car['rig'].name} left={left:.4f} right={right:.4f} bias={roll_bias:.4f}")
        if abs(error) < 0.008 or left > 1e8 or right > 1e8:
            break
        trial = roll_bias - error / 1.55
        car["roll_bias"] = trial
        place(car, DURATION, radius, wheelbase)
        bpy.context.view_layer.update()
        improved = abs(side_contact(car, True) - side_contact(car, False)) < abs(error) - 0.001
        if improved:
            roll_bias = trial
            continue
        roll_bias = trial + 2.0 * error / 1.55
        car["roll_bias"] = roll_bias
        place(car, DURATION, radius, wheelbase)
        bpy.context.view_layer.update()
    # Pitch is solved below, then roll is solved again so the pitch does not lift one side.
    bias = 0.0
    for _ in range(5):
        front = axle_low(car["front"])
        rear = axle_low(car["rear"])
        error = front - rear
        print(f"LEVEL {car['rig'].name} front={front:.4f} rear={rear:.4f} bias={bias:.4f}")
        if abs(error) < 0.008 or front > 1e8 or rear > 1e8:
            break
        delta = error / max(wheelbase, 1.0)
        car["pitch_bias"] = bias - delta
        place(car, DURATION, radius, wheelbase)
        bpy.context.view_layer.update()
        improved = abs(axle_low(car["front"]) - axle_low(car["rear"])) < abs(error) - 0.001
        if improved:
            bias -= delta
            continue
        bias += delta
        car["pitch_bias"] = bias
        place(car, DURATION, radius, wheelbase)
        bpy.context.view_layer.update()
    for _ in range(4):
        left = side_contact(car, True)
        right = side_contact(car, False)
        error = left - right
        print(f"ROLL2 {car['rig'].name} left={left:.4f} right={right:.4f} bias={car.get('roll_bias', 0):.4f}")
        if abs(error) < 0.006 or left > 1e8 or right > 1e8:
            break
        trial = car.get("roll_bias", 0.0) - error / 1.55
        car["roll_bias"] = trial
        place(car, DURATION, radius, wheelbase)
        bpy.context.view_layer.update()
        if abs(side_contact(car, True) - side_contact(car, False)) >= abs(error) - 0.001:
            car["roll_bias"] = trial + 2.0 * error / 1.55
            place(car, DURATION, radius, wheelbase)
            bpy.context.view_layer.update()
            break
    tire_low = min(axle_low(car["front"]), axle_low(car["rear"]))
    if tire_low > 1e8:
        print("PLANT", car["rig"].name, "no tire mesh")
        return
    car["z"] += 0.004 - tire_low
    place(car, DURATION, radius, wheelbase)
    bpy.context.view_layer.update()
    body = []
    hubs = set(car["front"] + car["rear"])
    for obj in bpy.context.scene.objects:
        if obj.type != "MESH" or obj.hide_render or obj.name == "Floor":
            continue
        parent = obj
        under_wheel = False
        while parent is not None and parent != car["rig"]:
            if parent in hubs:
                under_wheel = True
            parent = parent.parent
        if parent == car["rig"] and not under_wheel:
            body.append(obj)
    body_low, _body_point = lowest_point(body) if body else (1.0, Vector())
    if body_low < 0.0:
        car["z"] += 0.002 - body_low
        place(car, DURATION, radius, wheelbase)
        bpy.context.view_layer.update()
    front = axle_low(car["front"])
    rear = axle_low(car["rear"])
    print(f"PLANT {car['rig'].name} front={front:.4f} rear={rear:.4f} body={body_low:.4f} bias={car.get('pitch_bias', 0):.4f}")


def body_meshes(car):
    hubs = set(car["front"] + car["rear"])
    found = []
    for obj in bpy.context.scene.objects:
        if obj.type != "MESH" or obj.hide_render or obj.name in {"Floor"} or obj.name.startswith("Contact"):
            continue
        parent = obj
        wheel = False
        while parent is not None and parent != car["rig"]:
            if parent in hubs:
                wheel = True
            parent = parent.parent
        if parent == car["rig"] and not wheel:
            found.append(obj)
    return found


def car_points(car, step=50):
    points = []
    for obj in body_meshes(car):
        matrix = obj.matrix_world
        verts = obj.data.vertices
        for index in range(0, len(verts), step):
            points.append(matrix @ verts[index].co)
    return points


def closest_gap(points_a, points_b):
    if not points_a or not points_b:
        return 1e9, None
    cell = 0.35
    grid = {}
    for point in points_b:
        key = (int(math.floor(point.x / cell)), int(math.floor(point.y / cell)), int(math.floor(point.z / cell)))
        grid.setdefault(key, []).append(point)
    best = 1e9
    pair = None
    for point in points_a:
        base = (int(math.floor(point.x / cell)), int(math.floor(point.y / cell)), int(math.floor(point.z / cell)))
        for dx in (-1, 0, 1):
            for dy in (-1, 0, 1):
                for dz in (-1, 0, 1):
                    for other in grid.get((base[0] + dx, base[1] + dy, base[2] + dz), ()):
                        dist = (point - other).length
                        if dist < best:
                            best = dist
                            pair = (point, other)
    if pair is None:
        for point in points_a[::6]:
            for other in points_b[::6]:
                dist = (point - other).length
                if dist < best:
                    best = dist
                    pair = (point, other)
    return best, pair


def shift_park(car, spec, delta, radius, wheelbase):
    spec["p3"] = (spec["p3"][0] + delta.x, spec["p3"][1] + delta.y)
    car["curve"] = Curve(spec)
    place(car, DURATION, radius, wheelbase)


def pack_lineup(g90, m4, gt3, g90_wb, m4_wb, gt3_wb):
    """Keep a small air gap. Centerline clearance was letting the corners occupy the same space."""
    target = 0.18
    for _ in range(8):
        place(g90, DURATION, g90["radius"], g90_wb)
        place(m4, DURATION, m4["radius"], m4_wb)
        place(gt3, DURATION, gt3["radius"], gt3_wb)
        bpy.context.view_layer.update()
        clouds = {id(g90): car_points(g90), id(m4): car_points(m4), id(gt3): car_points(gt3)}
        gap_m4, _pair = closest_gap(clouds[id(g90)], clouds[id(m4)])
        gap_gt3, _pair = closest_gap(clouds[id(g90)], clouds[id(gt3)])
        gap_sides, _pair = closest_gap(clouds[id(m4)], clouds[id(gt3)])
        print(f"GAP m4 {gap_m4:.3f} gt3 {gap_gt3:.3f} sides {gap_sides:.3f}")
        if gap_m4 >= target and gap_gt3 >= target and gap_sides >= target:
            break
        # Step sideways. The contact normal slid along the overlap and never opened it.
        if gap_m4 < target:
            shift_park(m4, M4_PATH, Vector((-0.16, 0.0, 0.0)), m4["radius"], m4_wb)
        if gap_gt3 < target:
            shift_park(gt3, GT3_PATH, Vector((0.16, 0.0, 0.0)), gt3["radius"], gt3_wb)
    print(f"PARK g90={G90_PATH['p3']} m4={M4_PATH['p3']} gt3={GT3_PATH['p3']}")


def audit_arrivals(g90, m4, gt3, g90_wb, m4_wb, gt3_wb):
    """Mesh gap while a car is still moving. The parked gap does not prove the arc is clear."""
    for label, car, spec, radius, wheelbase in (
        ("m4", m4, M4_PATH, m4["radius"], m4_wb),
        ("gt3", gt3, GT3_PATH, gt3["radius"], gt3_wb),
    ):
        for frac in (0.55, 0.75, 0.9, 1.0):
            t = spec["t0"] + (spec["t1"] - spec["t0"]) * frac
            place(g90, DURATION, g90["radius"], g90_wb)
            place(m4, DURATION, m4["radius"], m4_wb)
            place(gt3, DURATION, gt3["radius"], gt3_wb)
            place(car, t, radius, wheelbase)
            bpy.context.view_layer.update()
            gap_g, _pair = closest_gap(car_points(car), car_points(g90))
            other = m4 if label == "gt3" else gt3
            gap_o, _pair = closest_gap(car_points(car), car_points(other))
            print(f"ARC {label} u={frac:.2f} g90={gap_g:.3f} other={gap_o:.3f}")


def sill_heights(car):
    """Outer rocker, front half against rear half. The hood is not the sill."""
    rig = car["rig"]
    inverse = rig.matrix_world.inverted()
    front = []
    rear = []
    for obj in body_meshes(car):
        matrix = obj.matrix_world
        verts = obj.data.vertices
        for index in range(0, len(verts), 28):
            world = matrix @ verts[index].co
            if world.z < 0.10 or world.z > 0.42:
                continue
            local = inverse @ world
            if abs(local.x) < 0.55 or abs(local.x) > 1.15:
                continue
            if local.y < -0.55:
                front.append(world.z)
            elif local.y > 0.7:
                rear.append(world.z)
    if len(front) < 12 or len(rear) < 12:
        return None
    front.sort()
    rear.sort()
    return front[len(front) // 5], rear[len(rear) // 5]


def level_gt3_shell(car):
    """Pitch only the body. The tire empties stay on the rig, so the contact does not lift."""
    orient = car.get("orient")
    if orient is None:
        return
    measured = sill_heights(car)
    if measured is None:
        print("RAKE none")
        return
    front_z, rear_z = measured
    print(f"RAKE before front={front_z:.3f} rear={rear_z:.3f}")
    error = front_z - rear_z
    # Only drop a nose that is actually high. A lower front sill is a normal race rake.
    if error < 0.02:
        return
    angle = math.atan2(error, max(car.get("wheelbase", 2.9), 1.0))
    pivot = car["rig"].matrix_world.translation.copy()
    axis = (car["rig"].matrix_world.to_3x3() @ Vector((1.0, 0.0, 0.0))).normalized()
    orient.matrix_world = (
        Matrix.Translation(pivot) @ Matrix.Rotation(angle, 4, axis) @ Matrix.Translation(-pivot) @ orient.matrix_world
    )
    bpy.context.view_layer.update()
    again = sill_heights(car)
    low = 1e9
    for obj in body_meshes(car):
        for index in range(0, len(obj.data.vertices), 40):
            low = min(low, (obj.matrix_world @ obj.data.vertices[index].co).z)
    if low < 0.0:
        # The splitter met the floor. Undo most of the pitch and keep the tires where they are.
        orient.matrix_world = (
            Matrix.Translation(pivot)
            @ Matrix.Rotation(-angle * 0.65, 4, axis)
            @ Matrix.Translation(-pivot)
            @ orient.matrix_world
        )
        bpy.context.view_layer.update()
        again = sill_heights(car)
        print(f"RAKE splitter {low:.3f} backed off")
    print(f"RAKE after {again}")


def add_tail_spots(rig, prefix):
    spots = []
    aim = Vector((0.0, 1.0, -0.04)).to_track_quat("-Z", "Y").to_euler()
    for side, x in (("L", 0.62), ("R", -0.62)):
        light = bpy.data.lights.new(f"{prefix}_T{side}", "SPOT")
        light.energy = 0.0
        light.spot_size = math.radians(32)
        light.spot_blend = 0.65
        light.color = (1.0, 0.03, 0.015)
        light.use_shadow = False
        obj = bpy.data.objects.new(light.name, light)
        bpy.context.scene.collection.objects.link(obj)
        obj.parent = rig
        obj.matrix_parent_inverse = Matrix.Identity(4)
        obj.location = Vector((x, 2.05, 0.62))
        obj.rotation_mode = "XYZ"
        obj.rotation_euler = aim
        spots.append(light)
    return spots


def add_contour(car, color, tag, energy=14.0):
    """A skirt of light on the floor. v7 is the reference pool, still one colour per car."""
    rig = car["rig"]
    origin = rig.matrix_world.translation
    yaw = rig.rotation_euler.z
    forward_vec = Vector((math.sin(yaw), -math.cos(yaw), 0.0))
    side = Vector((math.cos(yaw), math.sin(yaw), 0.0))
    if v7_requested():
        # Skirts and a nose patch paint the floor. The pool is shadowed by the
        # body, so the emitter stays hidden and only a halo escapes the sills.
        specs = (
            ("L", origin + side * 0.95 + Vector((0.0, 0.0, 0.11)), 4.4, 0.42, False, 1.15),
            ("R", origin - side * 0.95 + Vector((0.0, 0.0, 0.11)), 4.4, 0.42, False, 1.15),
            ("N", origin + forward_vec * 2.35 + Vector((0.0, 0.0, 0.16)), 2.2, 1.15, False, 2.6),
            ("W", origin + forward_vec * 3.15 + Vector((0.0, 0.0, 0.22)), 2.4, 1.35, False, 2.0),
            ("T", origin - forward_vec * 2.45 + Vector((0.0, 0.0, 0.05)), 1.7, 0.45, False, 0.7),
            ("P", origin + Vector((0.0, 0.0, 0.28)), 1.5, 3.4, True, 1.6),
        )
    else:
        specs = (
            ("L", origin + side * 1.02 + Vector((0.0, 0.0, 0.16)), 3.3, 0.28, False, 1.0),
            ("R", origin - side * 1.02 + Vector((0.0, 0.0, 0.16)), 3.3, 0.28, False, 1.0),
            ("N", origin + forward_vec * 2.05 + Vector((0.0, 0.0, 0.14)), 1.55, 0.24, False, 1.0),
            ("T", origin - forward_vec * 2.05 + Vector((0.0, 0.0, 0.14)), 1.55, 0.24, False, 1.0),
            ("P", origin + Vector((0.0, 0.0, 0.2)), 2.4, 4.2, False, 0.55),
        )
    for name, location, size, size_y, shadow, scale in specs:
        light = bpy.data.lights.new(f"Glow{tag}{name}", "AREA")
        light.energy = energy * scale
        light.color = color
        light.shape = "RECTANGLE"
        light.size = size
        light.size_y = size_y
        light.use_shadow = shadow
        obj = bpy.data.objects.new(light.name, light)
        if v7_requested():
            obj.visible_camera = False
        bpy.context.scene.collection.objects.link(obj)
        obj.location = location
        look_at(obj, location + Vector((0.0, 0.0, -1.0)))
        parent_keep(obj, rig)


def ignite_material(mat, red):
    node = bsdf(mat)
    if node is None or "Emission Strength" not in node.inputs or node.inputs["Emission Strength"].is_linked:
        return
    node.inputs["Emission Strength"].default_value = (
        (50.0 if red else 120.0) if v8_requested() else ((36.0 if red else 80.0) if v7_requested() else (9.0 if red else 16.0))
    )
    color_in = node.inputs.get("Emission Color")
    base = node.inputs.get("Base Color")
    if color_in is not None and not color_in.is_linked and base is not None and base.is_linked:
        mat.node_tree.links.new(base.links[0].from_socket, color_in)
    elif color_in is not None and not color_in.is_linked:
        color_in.default_value = (1.0, 0.05, 0.02, 1.0) if red else (1.0, 0.97, 0.9, 1.0)
    if "Transmission Weight" in node.inputs and not node.inputs["Transmission Weight"].is_linked:
        node.inputs["Transmission Weight"].default_value = max(float(node.inputs["Transmission Weight"].default_value), 0.25)
    print("IGNITE", mat.name, "tail" if red else "head")


def place(car, t, radius, wheelbase):
    curve = car["curve"]
    pos, yaw, curvature = curve.at_time(t)
    steer = max(-0.22, min(0.22, math.atan(wheelbase * curvature)))
    if t >= curve.t1:
        steer = 0.0
    elif curve.t1 - t < 0.5:
        steer *= (curve.t1 - t) / 0.5
    dt = 0.08
    speed_now = (curve.distance_at(t) - curve.distance_at(t - dt)) / dt
    speed_prev = (curve.distance_at(t - dt) - curve.distance_at(t - 2 * dt)) / dt
    accel = (speed_now - speed_prev) / dt
    pitch = max(-math.radians(1.0), min(math.radians(2.3), -accel * 0.016)) + car.get("pitch_bias", 0.0)
    roll = max(-math.radians(1.6), min(math.radians(1.6), -steer * 0.28)) + car.get("roll_bias", 0.0)
    travelled = curve.distance_at(t)
    rig = car["rig"]
    rig.location = Vector((pos.x, pos.y, car["z"]))
    rig.rotation_mode = "ZXY"
    rig.rotation_euler = (pitch, roll, yaw)
    roll_spin = travelled / radius
    for obj in car["front"]:
        spin_wheel(obj, car["rest"][obj.name], roll_spin, steer)
    for obj in car["rear"]:
        spin_wheel(obj, car["rest"][obj.name], roll_spin, 0.0)
    if t <= curve.t0:
        lamp = 0.0
    elif t >= curve.t1:
        lamp = 1.0
    else:
        lamp = smooth((shaped((t - curve.t0) / (curve.t1 - curve.t0)) - 0.72) / 0.28)
    head = 70.0 if v7_requested() else (150.0 if v6_requested() else 70.0)
    for light in car["spots"]:
        light.energy = head * lamp
    for light in car.get("tails", []):
        light.energy = (90.0 if v7_requested() else (55.0 if v6_requested() else 0.0)) * lamp
    return steer, travelled


def build_car(new_objects, rig_name, front_names, rear_names, curve):
    rig = make_rig(new_objects, rig_name)
    front = [bpy.data.objects[name] for name in front_names]
    rear = [bpy.data.objects[name] for name in rear_names]
    rest = {}
    for obj in front + rear:
        if obj.rotation_mode != "QUATERNION":
            obj.rotation_mode = "QUATERNION"
        rest[obj.name] = obj.rotation_quaternion.copy()
    bottom = tire_bottom(front_names + rear_names)
    z = rig.location.z + (0.012 - bottom)
    return {
        "rig": rig,
        "front": front,
        "rear": rear,
        "rest": rest,
        "curve": curve,
        "z": z,
        "radius": wheel_radius(front_names[0]),
        "spots": add_spots(rig, rig_name),
        "travel": 0.0,
        "prev_pos": None,
        "prev_s": None,
        "prev_speed": None,
        "prev_t": -1.0,
    }


def mesh_center(obj):
    low = Vector((1e9, 1e9, 1e9))
    high = Vector((-1e9, -1e9, -1e9))
    for corner in obj.bound_box:
        point = obj.matrix_world @ Vector(corner)
        low = Vector((min(low.x, point.x), min(low.y, point.y), min(low.z, point.z)))
        high = Vector((max(high.x, point.x), max(high.y, point.y), max(high.z, point.z)))
    return (low + high) * 0.5, high - low


def build_gt3(new_objects, curve):
    """Stand the Y-up export on its wheels and rig the four tire clusters.

    The download also contains an upside-down copy (mesh_132). That copy stays out.
    """
    for obj in list(new_objects):
        if obj.name not in bpy.data.objects:
            continue
        if obj.type in {"LIGHT", "CAMERA"} or obj.name == "Cube" or obj.name.startswith("mesh_132"):
            bpy.data.objects.remove(obj, do_unlink=True)
    orient = bpy.data.objects.new("GT3Orient", None)
    bpy.context.scene.collection.objects.link(orient)
    orient.rotation_euler = (math.radians(90.0), 0.0, math.radians(180.0))
    for obj in list(bpy.context.scene.objects):
        if obj.parent is None and obj != orient and obj.name.startswith("mesh_135"):
            obj.parent = orient
    bpy.context.view_layer.update()
    lowest = min(
        (obj.matrix_world @ vertex.co).z
        for obj in bpy.context.scene.objects
        if obj.type == "MESH" and obj.name.startswith("mesh_135")
        for vertex in obj.data.vertices
    )
    orient.location.z -= lowest - 0.012
    bpy.context.view_layer.update()

    tires = []
    for obj in bpy.context.scene.objects:
        if obj.type != "MESH" or not obj.name.startswith("mesh_135"):
            continue
        center, size = mesh_center(obj)
        if abs(center.x) > 0.55 and 0.65 < size.z < 1.05 and 0.65 < size.y < 1.05 and center.z < 1.15:
            tires.append((center, obj))
    tires.sort(key=lambda item: len(item[1].data.polygons), reverse=True)
    hubs = []
    for center, _obj in tires:
        if any((center.xy - hub.xy).length < 0.45 for hub in hubs):
            continue
        hubs.append(center)
        if len(hubs) == 4:
            break
    if len(hubs) != 4:
        raise RuntimeError(f"GT3 wheel hubs {len(hubs)}")
    front_y = sorted(hub.y for hub in hubs)[1]
    front_hubs = [hub for hub in hubs if hub.y <= front_y]
    rear_hubs = [hub for hub in hubs if hub.y > front_y]

    def members(hub):
        found = []
        for obj in bpy.context.scene.objects:
            if obj.type != "MESH" or not obj.name.startswith("mesh_135"):
                continue
            center, size = mesh_center(obj)
            if max(size) > 1.2:
                continue
            if (center.xy - hub.xy).length < 0.38 and abs(center.z - hub.z) < 0.45:
                found.append(obj)
        return found

    rig = bpy.data.objects.new("GT3", None)
    bpy.context.scene.collection.objects.link(rig)
    anchor = sum(hubs, Vector((0.0, 0.0, 0.0))) / 4.0
    rig.location = Vector((anchor.x, anchor.y, 0.45))
    bpy.context.view_layer.update()
    parent_keep(orient, rig)

    def spin_empty(name, hub):
        empty = bpy.data.objects.new(name, None)
        bpy.context.scene.collection.objects.link(empty)
        empty.parent = rig
        empty.matrix_parent_inverse = Matrix.Identity(4)
        empty.location = hub - rig.location
        empty.rotation_mode = "QUATERNION"
        empty.rotation_quaternion = Quaternion((1.0, 0.0, 0.0, 0.0))
        bpy.context.view_layer.update()
        found = members(hub)
        print(f"GT3 HUB {name} members {len(found)} at {tuple(round(v, 2) for v in hub)}")
        for obj in found:
            parent_keep(obj, empty)
        return empty

    front = [spin_empty(f"GT3_F{index}", hub) for index, hub in enumerate(front_hubs)]
    rear = [spin_empty(f"GT3_R{index}", hub) for index, hub in enumerate(rear_hubs)]
    # A mesh whose centre leaves the hub is parented off the axle. Hide it.
    radius = 0.35
    for empty in front + rear:
        before = {}
        for child in bpy.context.scene.objects:
            if child.parent == empty and child.type == "MESH":
                before[child] = mesh_center(child)[0].copy()
        empty.rotation_quaternion = Quaternion((1.0, 0.0, 0.0), 0.9)
        bpy.context.view_layer.update()
        for child, old in before.items():
            shifted = (mesh_center(child)[0] - old).length
            if shifted > 0.05:
                child.hide_render = True
                STAY_HIDDEN.add(child)
            else:
                zs = [(child.matrix_world @ vertex.co).z for vertex in child.data.vertices]
                if zs and 0.55 < (max(zs) - min(zs)) < 0.9:
                    radius = (max(zs) - min(zs)) * 0.5
        empty.rotation_quaternion = Quaternion((1.0, 0.0, 0.0, 0.0))
    bpy.context.view_layer.update()
    return {
        "rig": rig,
        "front": front,
        "rear": rear,
        "rest": {obj.name: obj.rotation_quaternion.copy() for obj in front + rear},
        "curve": curve,
        "z": rig.location.z,
        "radius": radius,
        "spots": add_spots(rig, "GT3"),
        "wheelbase": abs(front_hubs[0].y - rear_hubs[0].y),
        "orient": orient,
    }


def tune_named_materials():
    """Glass was exported opaque. Paint stays a clearcoat, not a chrome shader."""
    for mat in bpy.data.materials:
        node = bsdf(mat)
        if node is None:
            continue
        low = mat.name.lower()
        glass = any(key in low for key in ("glass", "windsh", "window"))
        lamp = any(key in low for key in ("tail", "red_glass", "tl_"))
        if glass and not lamp:
            node.inputs["Transmission Weight"].default_value = 0.98
            node.inputs["Roughness"].default_value = 0.015
            node.inputs["Metallic"].default_value = 0.0
            if "IOR" in node.inputs:
                node.inputs["IOR"].default_value = 1.52
            if "Coat Weight" in node.inputs:
                node.inputs["Coat Weight"].default_value = 0.0
            if not node.inputs["Base Color"].is_linked:
                node.inputs["Base Color"].default_value = (0.72, 0.76, 0.78, 1.0)
            mat.blend_method = "HASHED"
            mat.use_screen_refraction = True
            mat.show_transparent_back = False
        if "tyre" in low or "tire" in low:
            node.inputs["Metallic"].default_value = 0.0
            if not node.inputs["Roughness"].is_linked:
                node.inputs["Roughness"].default_value = 0.78
            if "Specular IOR Level" in node.inputs and not node.inputs["Specular IOR Level"].is_linked:
                node.inputs["Specular IOR Level"].default_value = 0.32
            if "Coat Weight" in node.inputs:
                node.inputs["Coat Weight"].default_value = 0.0
        if low.startswith("ext_rim") or "lightsilver" in low or "apex_rim" in low:
            node.inputs["Metallic"].default_value = 1.0
            if not node.inputs["Roughness"].is_linked:
                node.inputs["Roughness"].default_value = 0.32
            if "Coat Weight" in node.inputs:
                node.inputs["Coat Weight"].default_value = 0.12
                node.inputs["Coat Roughness"].default_value = 0.12


def coat_gt3_body(rig):
    """The GT3 livery is a flat albedo. A clearcoat gives the panels volume."""
    body = set()
    for obj in bpy.context.scene.objects:
        if obj.type != "MESH":
            continue
        parent = obj
        while parent is not None and parent != rig:
            parent = parent.parent
        if parent != rig:
            continue
        _center, size = mesh_center(obj)
        if max(size) < 1.15:
            continue
        for slot in obj.material_slots:
            if slot.material:
                body.add(slot.material)
    for mat in body:
        node = bsdf(mat)
        if node is None:
            continue
        if "Coat Weight" in node.inputs:
            node.inputs["Coat Weight"].default_value = 0.62
            node.inputs["Coat Roughness"].default_value = 0.1
        if not node.inputs["Roughness"].is_linked:
            node.inputs["Roughness"].default_value = 0.26
        if "Coat Roughness" in node.inputs:
            node.inputs["Coat Roughness"].default_value = 0.06
        if "Specular IOR Level" in node.inputs and not node.inputs["Specular IOR Level"].is_linked:
            node.inputs["Specular IOR Level"].default_value = 0.5


def boost_lamps():
    """Headlamp shells in these exports are often unlit. A small emission makes the lens read."""
    keys = ("drl_glass", "headlight", "head_lamp", "taillight", "tail_light", "indicator")
    for mat in bpy.data.materials:
        node = bsdf(mat)
        if node is None or "Emission Strength" not in node.inputs:
            continue
        low = mat.name.lower()
        if any(skip in low for skip in ("_nm", "_ao", "detail", "detailed")):
            continue
        if not any(key in low for key in keys):
            continue
        if node.inputs["Emission Strength"].is_linked:
            continue
        red = any(key in low for key in ("tail", "rear", "stop"))
        if v6_requested():
            ignite_material(mat, red)
            continue
        node.inputs["Emission Strength"].default_value = 2.4
        if "Emission Color" in node.inputs and not node.inputs["Emission Color"].is_linked:
            node.inputs["Emission Color"].default_value = (1.0, 0.95, 0.86, 1.0)
        if "Transmission Weight" in node.inputs and "glass" in low:
            node.inputs["Transmission Weight"].default_value = max(
                float(node.inputs["Transmission Weight"].default_value), 0.35
            )
        print("LAMP", mat.name)


LIVERY_IMAGES = {"000002395C8219E0", "000002395C823820"}
TIRE_IMAGES = {"00000235C9F39020"}


def linked_images(mat):
    node = bsdf(mat)
    if node is None or "Base Color" not in node.inputs or not node.inputs["Base Color"].is_linked:
        return set()
    found = set()
    stack = [node.inputs["Base Color"].links[0].from_node]
    seen = set()
    while stack:
        current = stack.pop()
        if current in seen:
            continue
        seen.add(current)
        if current.type == "TEX_IMAGE" and current.image:
            found.add(current.image.name)
        for socket in current.inputs:
            for link in socket.links:
                stack.append(link.from_node)
    return found


def bess_paint_material():
    """Scene-only graphite clearcoat. The source GLB is not rewritten.

    A new material does not license the car design or the BMW marks.
    """
    mat = bpy.data.materials.new("BESS_GT3_Paint")
    mat.use_nodes = True
    node = mat.node_tree.nodes["Principled BSDF"]
    node.inputs["Base Color"].default_value = (0.085, 0.088, 0.092, 1.0)
    node.inputs["Metallic"].default_value = 0.0
    node.inputs["Roughness"].default_value = 0.34
    node.inputs["Coat Weight"].default_value = 1.0
    node.inputs["Coat Roughness"].default_value = 0.028
    node.inputs["Specular IOR Level"].default_value = 0.5
    return mat


def is_livery_image(name):
    return name.startswith("000002395C8219E0") or name.startswith("000002395C823820")


def recolor_keep_maps(mat, color):
    """Copy the shader and swap only the paint colour, so normals stay on the mesh.

    The copy lives in the scene. The GLB file is not saved.
    """
    copy = mat.copy()
    copy.name = "BESS_" + mat.name
    node = bsdf(copy)
    if node is None:
        return copy
    if node.inputs["Base Color"].is_linked:
        for link in list(node.inputs["Base Color"].links):
            copy.node_tree.links.remove(link)
    node.inputs["Base Color"].default_value = (*color, 1.0)
    for socket_name in ("Emission Color", "Emission Strength", "Alpha"):
        socket = node.inputs.get(socket_name)
        if socket is None or not socket.is_linked:
            continue
        for link in list(socket.links):
            copy.node_tree.links.remove(link)
    if "Emission Strength" in node.inputs:
        node.inputs["Emission Strength"].default_value = 0.0
    if "Alpha" in node.inputs:
        node.inputs["Alpha"].default_value = 1.0
    if v6_requested():
        node.inputs["Metallic"].default_value = 0.0
    else:
        node.inputs["Metallic"].default_value = 0.22 if v5_requested() else 0.0
    if os.environ.get("GT3_DEBUG") and mat.name in {"mat_64", "mat_9", "mat_63", "mat_30"}:
        color_now = tuple(round(v, 3) for v in node.inputs["Base Color"].default_value)
        print("RECOLOR", mat.name, "linked", node.inputs["Base Color"].is_linked, "color", color_now)
    if not node.inputs["Roughness"].is_linked:
        node.inputs["Roughness"].default_value = (
            0.15 if v8_requested() else (0.18 if v7_requested() else (0.34 if v6_requested() else (0.24 if v5_requested() else 0.32)))
        )
    if "Coat Weight" in node.inputs:
        node.inputs["Coat Weight"].default_value = 1.0
        node.inputs["Coat Roughness"].default_value = (
            0.012 if v8_requested() else (0.02 if v7_requested() else (0.04 if v6_requested() else (0.16 if v5_requested() else 0.055)))
        )
    if "Specular IOR Level" in node.inputs and not node.inputs["Specular IOR Level"].is_linked:
        node.inputs["Specular IOR Level"].default_value = 0.5
    return copy


def glass_copy(mat):
    """Scene-only glass. The exported windshield is an opaque shell."""
    copy = mat.copy()
    copy.name = "BESS_GLASS_" + mat.name
    node = bsdf(copy)
    if node is None:
        return copy
    for socket_name in ("Base Color", "Emission Color", "Emission Strength", "Alpha", "Roughness"):
        socket = node.inputs.get(socket_name)
        if socket is None or not socket.is_linked:
            continue
        for link in list(socket.links):
            copy.node_tree.links.remove(link)
    node.inputs["Base Color"].default_value = (0.45, 0.5, 0.52, 1.0)
    node.inputs["Metallic"].default_value = 0.0
    node.inputs["Roughness"].default_value = 0.03 if v6_requested() else (0.12 if v5_requested() else 0.06)
    node.inputs["Transmission Weight"].default_value = 0.96
    if "IOR" in node.inputs:
        node.inputs["IOR"].default_value = 1.52
    if "Coat Weight" in node.inputs:
        node.inputs["Coat Weight"].default_value = 0.15
        node.inputs["Coat Roughness"].default_value = 0.04
    if "Emission Strength" in node.inputs:
        node.inputs["Emission Strength"].default_value = 0.0
    if "Alpha" in node.inputs:
        node.inputs["Alpha"].default_value = 1.0
    copy.blend_method = "HASHED"
    copy.use_screen_refraction = True
    copy.show_transparent_back = False
    return copy


def y_span(obj, inverse):
    verts = obj.data.vertices
    step = max(1, len(verts) // 500)
    ymin = 1e9
    ymax = -1e9
    zmin = 1e9
    zmax = -1e9
    for index in range(0, len(verts), step):
        world = obj.matrix_world @ verts[index].co
        local_y = (inverse @ world).y
        ymin = min(ymin, local_y)
        ymax = max(ymax, local_y)
        zmin = min(zmin, world.z)
        zmax = max(zmax, world.z)
    return ymin, ymax, zmin, zmax


def ignite_gt3_ends(rig):
    """Light pieces that actually reach the nose or the tail, not the cabin."""
    inverse = rig.matrix_world.inverted()
    spans = []
    for obj in bpy.context.scene.objects:
        if obj.type != "MESH" or obj.hide_render or obj in STAY_HIDDEN or not obj.data.vertices:
            continue
        parent = obj
        wheel = False
        while parent is not None and parent != rig:
            if parent.name.startswith(("GT3_F", "GT3_R")):
                wheel = True
            parent = parent.parent
        if parent != rig or wheel:
            continue
        spans.append((obj, y_span(obj, inverse)))
    if not spans:
        print("GT3 LAMPS none")
        return
    nose = min(item[1][0] for item in spans)
    tail = max(item[1][1] for item in spans)
    lit = 0
    for obj, (ymin, ymax, zmin, zmax) in spans:
        # A lamp housing reaches the end and stays there. The body shell runs the whole length.
        head = ymin < nose + 0.28 and ymax < nose + 1.15 and zmax > 0.30 and zmin < 0.92
        # zmax stops the rear wing. Its endplates sit above the lamp line and were glowing.
        red = ymax > tail - 0.28 and ymin > tail - 1.15 and 0.28 < zmin and zmax < 0.98
        if not head and not red:
            continue
        for slot in obj.material_slots:
            mat = slot.material
            if mat is None or mat.name.startswith(("BESS_LAMP", "BESS_GLASS")):
                continue
            node = bsdf(mat)
            if node is None:
                continue
            if "Transmission Weight" in node.inputs and float(node.inputs["Transmission Weight"].default_value) > 0.5:
                continue
            copy = mat.copy()
            copy.name = "BESS_LAMP_" + mat.name
            slot.material = copy
            tail_lamp = red and not head
            ignite_material(copy, tail_lamp)
            lamp_node = bsdf(copy)
            if lamp_node is not None and "Emission Strength" in lamp_node.inputs:
                wide = (ymax - ymin) > 0.55 or (zmax - zmin) > 0.45
                lamp_node.inputs["Emission Strength"].default_value = (8.0 if tail_lamp else 12.0) if wide else (14.0 if tail_lamp else 32.0)
            lit += 1
            print(
                "GT3SLOT",
                "tail" if tail_lamp else "head",
                obj.name,
                f"y={ymin:.2f}..{ymax:.2f}",
                f"z={zmin:.2f}..{zmax:.2f}",
                mat.name,
            )
    # Hidden bumper faces were not the surface the camera sees. Hit the visible shell
    # from in front and from behind, then light that material or sit a lens on it.
    head_cards, tail_cards = plant_visible_optics(rig, nose, tail)
    print(f"GT3 LAMPS lit={lit} cards={head_cards}/{tail_cards} nose={nose:.2f} tail={tail:.2f}")


def optic_material(name, red):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    node = mat.node_tree.nodes["Principled BSDF"]
    color = (1.0, 0.045, 0.012, 1.0) if red else (1.0, 0.97, 0.9, 1.0)
    node.inputs["Base Color"].default_value = color
    node.inputs["Emission Color"].default_value = color
    node.inputs["Emission Strength"].default_value = 16.0 if red else 30.0
    node.inputs["Roughness"].default_value = 0.14
    if "Coat Weight" in node.inputs:
        node.inputs["Coat Weight"].default_value = 0.0
    return mat


def plant_visible_optics(rig, nose, tail):
    """Ray-cast the visible nose and tail. Light the surface that is actually in front."""
    bpy.context.view_layer.update()
    scene = bpy.context.scene
    depsgraph = bpy.context.evaluated_depsgraph_get()
    inverse = rig.matrix_world.inverted()
    rot = rig.matrix_world.to_3x3()
    head_hits = []
    tail_hits = []
    def facing(normal, forward):
        local_normal = (inverse.to_3x3() @ normal).normalized()
        return local_normal.y < -0.45 if forward else local_normal.y > 0.45

    def march(start, direction, forward, bucket, side):
        origin = start
        budget = 1.4
        for _ in range(7):
            hit, loc, normal, index, obj, _matrix = scene.ray_cast(depsgraph, origin, direction, distance=budget)
            if not hit or obj is None or obj.type != "MESH":
                return
            if facing(normal, forward):
                bucket.append((side, obj, index, loc, normal))
                return
            step = (loc - origin).length + 0.025
            origin = loc + direction * 0.025
            budget -= step
            if budget <= 0.05:
                return

    direction_head = (rot @ Vector((0.0, 1.0, 0.0))).normalized()
    direction_tail = (rot @ Vector((0.0, -1.0, 0.0))).normalized()
    for side in (-1.0, 1.0):
        for along in (0.18, 0.34, 0.50, 0.66):
            for z in (0.28, 0.40, 0.52, 0.64):
                march(
                    rig.matrix_world @ Vector((side * along, nose - 0.5, z)),
                    direction_head,
                    True,
                    head_hits,
                    side,
                )
            for z in (0.36, 0.48, 0.60):
                march(
                    rig.matrix_world @ Vector((side * along, tail + 0.5, z)),
                    direction_tail,
                    False,
                    tail_hits,
                    side,
                )

    def material_of(obj, index):
        poly = obj.data.polygons[index]
        if not obj.material_slots:
            return None
        return obj.material_slots[poly.material_index].material

    def is_paint(mat):
        if mat is None:
            return True
        return mat.name.startswith("BESS_") and not mat.name.startswith(("BESS_LAMP", "BESS_GLASS", "BESS_GT3_HEAD", "BESS_GT3_TAIL"))

    print(f"RAYHITS head={len(head_hits)} tail={len(tail_hits)}")
    lit_slots = set()
    cards = [0, 0]
    clusters = {(-1.0, False): [], (1.0, False): [], (-1.0, True): [], (1.0, True): []}
    for red, group in ((False, head_hits), (True, tail_hits)):
        for side, obj, index, loc, normal in group:
            mat = material_of(obj, index)
            local = inverse @ loc
            name = mat.name if mat else "-"
            if not is_paint(mat) and (obj.name, mat.name) not in lit_slots:
                copy = mat.copy()
                copy.name = "BESS_LAMP_" + mat.name
                ignite_material(copy, red)
                for slot in obj.material_slots:
                    if slot.material == mat:
                        slot.material = copy
                lit_slots.add((obj.name, mat.name))
                print(f"RAYLIT {'tail' if red else 'head'} {obj.name} {name} y={local.y:.2f} z={local.z:.2f}")
            elif is_paint(mat):
                clusters[(side, red)].append((loc, normal))
                print(f"RAYPAINT {'tail' if red else 'head'} {obj.name} {name} y={local.y:.2f} z={local.z:.2f}")
    for (side, red), points in clusters.items():
        if len(points) < 2:
            continue
        top = max(point.z for point, _normal in points)
        band = [item for item in points if item[0].z >= top - 0.04] or points
        center = sum((point for point, _normal in band), Vector()) / len(band)
        normal = sum((normal for _point, normal in band), Vector())
        if normal.length < 1e-6:
            normal = rot @ (Vector((0.0, -1.0, 0.0)) if not red else Vector((0.0, 1.0, 0.0)))
        normal.normalize()
        outward = rot @ (Vector((0.0, 1.0, 0.0)) if red else Vector((0.0, -1.0, 0.0)))
        outward.normalize()
        # Clear the grille slats. The hit itself is often inside the opening.
        if v7_requested():
            add_optic_pod(
                rig,
                center + outward * 0.034,
                outward,
                f"GT3Pod{'T' if red else 'H'}{int(side)}",
                red,
            )
        else:
            add_lens_card(
                rig,
                center + outward * 0.035,
                outward,
                f"GT3Lens{'T' if red else 'H'}{int(side)}",
                red,
            )
        cards[1 if red else 0] += 1
    return cards


def add_optic_pod(rig, location, outward, name, red):
    """A lamp with a housing, a glass cover, and LED elements. Not a flat white bar."""
    up = Vector((0.0, 0.0, 1.0))
    side = outward.cross(up)
    if side.length < 1e-6:
        side = Vector((1.0, 0.0, 0.0))
    side.normalize()
    outward = outward.normalized()
    up = side.cross(outward).normalized()
    rot = Matrix((side, up, outward)).transposed().to_quaternion()
    shrink = 0.78 if red else 1.0

    def put(obj, local, scale):
        obj.matrix_world = Matrix.LocRotScale(location, rot, Vector((1.0, 1.0, 1.0))) @ Matrix.LocRotScale(
            Vector(local) * shrink,
            Quaternion((1.0, 0.0, 0.0, 0.0)),
            Vector(scale) * shrink,
        )
        parent_keep(obj, rig)

    def make(tag, local, scale, mat, sphere=False):
        if sphere:
            bpy.ops.mesh.primitive_uv_sphere_add(radius=0.5, segments=16, ring_count=8)
        else:
            bpy.ops.mesh.primitive_cube_add(size=1.0)
        obj = bpy.context.active_object
        obj.name = f"{name}{tag}"
        obj.data.materials.append(mat)
        put(obj, local, scale)

    def shade(suffix, color, emission, rough, transmission=0.0, metallic=0.0):
        mat = bpy.data.materials.new(name + suffix)
        mat.use_nodes = True
        node = mat.node_tree.nodes["Principled BSDF"]
        node.inputs["Base Color"].default_value = (*color, 1.0)
        node.inputs["Emission Color"].default_value = (*color, 1.0)
        node.inputs["Emission Strength"].default_value = emission
        node.inputs["Roughness"].default_value = rough
        node.inputs["Metallic"].default_value = metallic
        if transmission and "Transmission Weight" in node.inputs:
            node.inputs["Transmission Weight"].default_value = transmission
            if "IOR" in node.inputs:
                node.inputs["IOR"].default_value = 1.5
            mat.blend_method = "HASHED"
            mat.use_screen_refraction = True
        return mat

    led_color = (1.0, 0.045, 0.012) if red else (1.0, 0.98, 0.92)
    housing = shade("H", (0.012, 0.012, 0.014), 0.0, 0.42)
    metal = shade("M", (0.04, 0.04, 0.045), 0.0, 0.22, metallic=1.0)
    glass = shade("G", (0.55, 0.08, 0.05) if red else (0.85, 0.9, 0.94), 0.0, 0.02, transmission=0.92)
    led = shade("L", led_color, 28.0 if red else 40.0, 0.18)
    lamp = shade("P", led_color, 90.0 if red else 180.0, 0.08)
    make("Bucket", (0.0, 0.0, -0.016), (0.16, 0.08, 0.046), housing)
    make("Bowl", (0.0, 0.0, -0.004), (0.12, 0.05, 0.018), metal)
    make("Bar", (0.0, 0.034, 0.012), (0.1, 0.0035, 0.003), led)
    for side_x in (-0.036, 0.036):
        make("Proj", (side_x, 0.016, 0.014), (0.044, 0.03, 0.018), lamp, sphere=True)
        bpy.ops.mesh.primitive_torus_add(
            major_radius=0.5, minor_radius=0.14, major_segments=20, minor_segments=8
        )
        ring = bpy.context.active_object
        ring.name = f"{name}Ring{int(side_x * 100)}"
        ring.data.materials.append(metal)
        put(ring, (side_x, 0.016, 0.016), (0.05, 0.038, 0.05))
    make("Lens", (0.0, 0.0, 0.016), (0.15, 0.068, 0.006), glass)
    print(f"POD {name} red={red}")


def add_lens_card(rig, location, normal, name, red):
    bpy.ops.mesh.primitive_plane_add(size=1.0, location=(0.0, 0.0, 0.0))
    plane = bpy.context.active_object
    plane.name = name
    # matrix_world is assigned whole. Setting .scale first is lost until the depsgraph runs.
    plane.matrix_world = Matrix.LocRotScale(
        location,
        normal.to_track_quat("Z", "X"),
        Vector((0.22, 0.038, 1.0)),
    )
    plane.data.materials.append(optic_material(name + "Mat", red))
    parent_keep(plane, rig)
    print(
        f"CARD {plane.name} loc={tuple(round(v, 2) for v in plane.matrix_world.translation)} "
        f"scale={tuple(round(v, 3) for v in plane.matrix_world.to_scale())}"
    )


def paint_optic_faces(obj, inverse, nose, tail, head_mat, tail_mat):
    import bmesh

    bm = bmesh.new()
    bm.from_mesh(obj.data)
    heads = []
    tails = []
    for face in bm.faces:
        world = obj.matrix_world @ face.calc_center_median()
        local = inverse @ world
        normal = (inverse.to_3x3() @ (obj.matrix_world.to_3x3() @ face.normal)).normalized()
        span = abs(local.x)
        if span < 0.16 or span > 0.86:
            continue
        if local.y < nose + 0.5 and normal.y < -0.3 and 0.34 < world.z < 0.72:
            heads.append(face)
        elif local.y > tail - 0.45 and normal.y > 0.3 and 0.40 < world.z < 0.78:
            tails.append(face)
    if not heads and not tails:
        bm.free()
        return 0, 0
    if heads:
        obj.data.materials.append(head_mat)
        index = len(obj.data.materials) - 1
        for face in heads:
            face.material_index = index
    if tails:
        obj.data.materials.append(tail_mat)
        index = len(obj.data.materials) - 1
        for face in tails:
            face.material_index = index
    bm.to_mesh(obj.data)
    obj.data.update()
    bm.free()
    return len(heads), len(tails)


def clarify_gt3_glass(rig):
    """Turn the windshield and side glass back into glass after the paint pass.

    Upward body panels stay paint. A panel counts as glass when its normals
    face the camera or the side, and it sits in the cabin band.
    """
    cache = {}
    converted = 0
    for obj in bpy.context.scene.objects:
        if obj.type != "MESH" or obj in STAY_HIDDEN or obj.hide_render:
            continue
        parent = obj
        while parent is not None and parent != rig:
            parent = parent.parent
        if parent != rig:
            continue
        wheel = False
        parent = obj.parent
        while parent is not None:
            if parent.name.startswith(("GT3_F", "GT3_R")):
                wheel = True
                break
            parent = parent.parent
        if wheel or not obj.data.polygons:
            continue
        center, size = mesh_center(obj)
        if center.z < 0.55 or max(size) < 0.35:
            continue
        weighted = Vector((0.0, 0.0, 0.0))
        area = 0.0
        for poly in obj.data.polygons:
            face = (obj.matrix_world.to_3x3() @ poly.normal).normalized()
            weighted += face * poly.area
            area += poly.area
        if area <= 0.0:
            continue
        normal = (weighted / area).normalized()
        # Some cabin shells were exported inside-out. Their outside then ignores the paint.
        if normal.z < -0.8 and center.z > 0.95 and max(size) > 0.8:
            obj.data.flip_normals()
            print("GT3 FLIP", obj.name, tuple(round(v, 2) for v in normal))
        side = abs(normal.x) > 0.72 and center.z > 0.7 and max(size) < 1.4
        screen = normal.y < -0.75 and center.z > 0.85 and max(size) > 0.5
        if not side and not screen:
            continue
        for slot in obj.material_slots:
            if slot.material is None:
                continue
            images = linked_images(slot.material)
            if any(name.startswith("00000235C9F39020") for name in images):
                continue
            source = slot.material
            if source.name not in cache:
                cache[source.name] = glass_copy(source)
            slot.material = cache[source.name]
            converted += 1
        print(
            "GT3 GLASS",
            obj.name,
            "side" if side else "screen",
            tuple(round(v, 2) for v in normal),
            "z",
            round(center.z, 2),
        )
    print(f"GT3 GLASS slots={converted}")


def darken_gt3_grille(rig):
    """The GT3 kidneys ship as bright slats. Darken the small front pieces, not the wheels."""
    bpy.context.view_layer.update()
    inverse = rig.matrix_world.inverted()
    darkened = 0
    for obj in list(bpy.context.scene.objects):
        if obj.type != "MESH" or obj.hide_render:
            continue
        parent = obj
        while parent is not None and parent != rig:
            parent = parent.parent
        if parent != rig:
            continue
        walker = obj.parent
        wheel = False
        while walker is not None:
            if walker.name.startswith(("GT3_F", "GT3_R")):
                wheel = True
                break
            walker = walker.parent
        if wheel or obj.name.startswith("GT3Pod"):
            continue
        center, size = mesh_center(obj)
        local = inverse @ center
        # The nose is the negative local Y. Small pieces there are the kidneys, not the body shell.
        if local.y > -1.7 or not (0.12 < local.z < 0.72) or max(size) > 0.55:
            continue
        for slot in obj.material_slots:
            mat = slot.material
            if mat is None or mat.name.startswith(("BESS_LAMP", "BESS_GLASS", "GT3Pod")):
                continue
            node = bsdf(mat)
            if node is None or "Base Color" not in node.inputs:
                continue
            base = node.inputs["Base Color"]
            bright = False
            if not base.is_linked:
                color = base.default_value
                bright = color[0] > 0.45 and color[1] > 0.45 and color[2] > 0.45
            elif max(size) < 0.7:
                bright = True
            if not bright:
                continue
            if base.is_linked:
                for link in list(base.links):
                    mat.node_tree.links.remove(link)
            base.default_value = (0.012, 0.013, 0.015, 1.0)
            node.inputs["Metallic"].default_value = 0.25
            if not node.inputs["Roughness"].is_linked:
                node.inputs["Roughness"].default_value = 0.48
            darkened += 1
            print("GRILLE", obj.name, mat.name, "y", round(local.y, 2))
    print(f"GRILLE darkened={darkened}")


def neutral_bess_gt3(rig):
    """Recolour the race body. Decal cards that only carry sponsor art are hidden.

    Removing those logos does not clear the vehicle design or the BMW trademarks.
    """
    cache = {}
    painted = 0
    hidden = 0
    # #555B64 gunmetal. Metallic is only on this paint; the green M4 stays a satin dielectric.
    if v8_requested():
        graphite = srgb_to_linear("8E1C2A")
    elif v7_requested():
        graphite = srgb_to_linear("0B0C0F")
    elif v6_requested():
        graphite = srgb_to_linear("14161A")
    elif v5_requested():
        graphite = srgb_to_linear("555B64")
    else:
        graphite = (0.016, 0.017, 0.019)
    for obj in list(bpy.context.scene.objects):
        if obj.type != "MESH" or obj in STAY_HIDDEN:
            continue
        parent = obj
        while parent is not None and parent != rig:
            parent = parent.parent
        if parent != rig:
            continue
        wheel = False
        parent = obj.parent
        while parent is not None:
            if parent.name.startswith(("GT3_F", "GT3_R")):
                wheel = True
                break
            parent = parent.parent
        if wheel:
            if os.environ.get("GT3_DEBUG") and max(mesh_center(obj)[1]) > 0.6:
                print("GT3WHEEL", obj.name, tuple(round(v, 2) for v in mesh_center(obj)[1]))
            continue
        slots = [slot for slot in obj.material_slots if slot.material]
        if os.environ.get("GT3_DEBUG") and mesh_center(obj)[0].z > 0.85:
            print(
                "GT3HIGH",
                obj.name,
                tuple(round(v, 2) for v in mesh_center(obj)[1]),
                [slot.material.name for slot in slots],
            )
        livery = any(any(is_livery_image(name) for name in linked_images(slot.material)) for slot in slots)
        _center, size = mesh_center(obj)
        if livery and max(size) < 1.15:
            obj.hide_render = True
            STAY_HIDDEN.add(obj)
            hidden += 1
            continue
        if not livery and max(size) < 0.3:
            if os.environ.get("GT3_DEBUG") and max(size) > 0.8:
                print("GT3SMALL", obj.name, tuple(round(v, 2) for v in size), [slot.material.name for slot in slots])
            continue
        for slot in slots:
            images = linked_images(slot.material)
            if any(name.startswith("00000235C9F39020") for name in images):
                continue
            node = bsdf(slot.material)
            if node and float(node.inputs["Transmission Weight"].default_value) > 0.45:
                continue
            source = slot.material
            if source.name not in cache:
                cache[source.name] = recolor_keep_maps(source, graphite)
            slot.material = cache[source.name]
            painted += 1
    print(f"GT3 NEUTRAL painted_slots={painted} hidden_decals={hidden}")
    if v6_requested():
        ignite_gt3_ends(rig)
    clarify_gt3_glass(rig)
    if os.environ.get("GT3_DEBUG"):
        for obj in bpy.context.scene.objects:
            if obj.type != "MESH":
                continue
            parent = obj
            while parent is not None and parent != rig:
                parent = parent.parent
            if parent != rig:
                continue
            for slot in obj.material_slots:
                if slot.material and not slot.material.name.startswith("BESS_"):
                    center, size = mesh_center(obj)
                    print(
                        "UNPAINTED",
                        obj.name,
                        tuple(round(v, 2) for v in size),
                        "z",
                        round(center.z, 2),
                        slot.material.name,
                    )


def visible_wheel_meshes(hub):
    count = 0
    for obj in bpy.context.scene.objects:
        if obj.type != "MESH" or obj in STAY_HIDDEN or obj.hide_render:
            continue
        parent = obj.parent
        under = False
        while parent is not None:
            if parent == hub:
                under = True
                break
            parent = parent.parent
        if under:
            count += 1
    return count


def add_lamp_glow(scene):
    """A small fog glow so the lamps and the floor light bloom the way a photo does."""
    scene.use_nodes = True
    tree = scene.node_tree
    tree.nodes.clear()
    layers = tree.nodes.new("CompositorNodeRLayers")
    glare = tree.nodes.new("CompositorNodeGlare")
    glare.glare_type = "FOG_GLOW"
    glare.quality = "HIGH"
    glare.threshold = 0.65
    glare.mix = -0.48
    glare.size = 6
    out = tree.nodes.new("CompositorNodeComposite")
    tree.links.new(layers.outputs["Image"], glare.inputs["Image"])
    tree.links.new(glare.outputs["Image"], out.inputs["Image"])


def configure_scene(width, height, samples, cycles):
    scene = bpy.context.scene
    scene.render.resolution_x = width
    scene.render.resolution_y = height
    scene.render.film_transparent = False
    scene.view_settings.view_transform = "AgX"
    scene.view_settings.look = "AgX - Base Contrast"
    v4_look = v4_requested() or v5_requested()
    scene.view_settings.exposure = (
        0.48 if v7_requested() else (0.34 if v6_requested() else (0.2 if v5_requested() else (-0.15 if v4_requested() else 0.35)))
    )
    if cycles:
        # Cycles reads everything after "--" and exits on our flags.
        if "--" in sys.argv:
            sys.argv = sys.argv[: sys.argv.index("--")]
        bpy.ops.preferences.addon_enable(module="cycles")
        scene.render.engine = "CYCLES"
        scene.cycles.samples = samples
        scene.cycles.device = "CPU"
        scene.cycles.use_adaptive_sampling = True
        scene.cycles.adaptive_threshold = 0.01 if v4_look else 0.03
        if v4_look:
            scene.cycles.adaptive_min_samples = 24
        scene.cycles.use_denoising = True
        scene.cycles.transmission_bounces = 8
        try:
            scene.cycles.denoiser = "OPENIMAGEDENOISE"
            print("DENOISER", scene.cycles.denoiser)
        except TypeError as exc:
            scene.cycles.use_denoising = False
            print("DENOISER unavailable", exc)
        if v7_requested():
            add_lamp_glow(scene)
    else:
        scene.render.engine = "BLENDER_EEVEE"
        scene.eevee.taa_render_samples = samples
        scene.eevee.use_bloom = True
        scene.eevee.bloom_intensity = 0.02
        scene.eevee.use_ssr = True
        scene.eevee.use_ssr_refraction = True
        scene.eevee.use_gtao = True
        scene.eevee.gtao_distance = 0.45
        scene.eevee.gtao_factor = 0.8
    return scene


def wheelbase(front_name, rear_name):
    a = bpy.data.objects[front_name].matrix_world.translation
    b = bpy.data.objects[rear_name].matrix_world.translation
    return (a - b).length


def main():
    RENDER_FLAGS.update(sys.argv)
    use_v6_parks()
    preview = "--preview" in sys.argv
    animatic = "--animatic" in sys.argv
    stills = "--stills" in sys.argv
    quality = "--quality" in sys.argv
    mobile = "--mobile" in sys.argv
    if not (preview or animatic or stills or quality):
        preview = True
    jobs = []
    if preview:
        jobs.append(("preview", "desktop"))
        jobs.append(("preview", "mobile"))
    if stills:
        jobs.append(("stills", "desktop"))
        if mobile:
            jobs.append(("stills", "mobile"))
    if animatic:
        jobs.append(("animatic", "desktop"))
        if mobile:
            jobs.append(("animatic", "mobile"))
    if quality:
        jobs.append(("quality", "desktop"))
        jobs.append(("quality", "mobile"))
        jobs.append(("motion", "desktop"))
    if "--mobile-still" in sys.argv:
        jobs = [("quality", "mobile")]
    if "--axle-still" in sys.argv:
        jobs = [("axle", "desktop")]
    if "--v8-gt3" in sys.argv:
        jobs = [("v8ee", "gt3")]
    elif "--v8-ee" in sys.argv:
        jobs = [("v8ee", "beauty"), ("v8ee", "gt3")]
    elif "--v8-reel" in sys.argv:
        jobs = [("v8reel", "desktop")]
    elif "--v8" in sys.argv:
        jobs = [
            ("v8", "desktop"),
            ("v8", "beauty"),
            ("v8", "wide"),
            ("v8", "g90"),
            ("v8", "m4"),
            ("v8", "gt3"),
            ("v8", "lamps"),
            ("v8", "glow"),
            ("v8", "ground"),
        ]
    elif "--v7-desk" in sys.argv:
        jobs = [("v7", "desktop")]
    elif "--v7-lamps" in sys.argv:
        jobs = [("v7", "lamps")]
    elif "--v7-check" in sys.argv:
        jobs = [("v7", "beauty"), ("v7", "gt3")]
    elif "--v7-ee" in sys.argv:
        jobs = [("v7ee", "beauty"), ("v7ee", "gt3"), ("v7ee", "glow"), ("v7ee", "lamps")]
    elif "--v7-reel" in sys.argv:
        jobs = [("v7reel", "desktop")]
    elif "--v7" in sys.argv:
        jobs = [
            ("v7", "desktop"),
            ("v7", "beauty"),
            ("v7", "wide"),
            ("v7", "g90"),
            ("v7", "m4"),
            ("v7", "gt3"),
            ("v7", "lamps"),
            ("v7", "glow"),
            ("v7", "ground"),
        ]
    elif "--v51-draft" in sys.argv:
        jobs = [("v5", "wide")]
    elif "--v51" in sys.argv:
        jobs = [("v5", "desktop"), ("v5", "wide"), ("v5", "g90"), ("v5", "gt3side")]
    elif "--v6-desk" in sys.argv:
        jobs = [("v6", "desktop")]
    elif "--v6-ee" in sys.argv:
        jobs = [("v6ee", "gt3"), ("v6ee", "beauty")]
    elif "--v6-fix" in sys.argv:
        jobs = [("v6", "desktop"), ("v6", "beauty"), ("v6", "wide"), ("v6", "m4"), ("v6", "gt3"), ("v6", "ground")]
    elif "--v6-draft" in sys.argv:
        jobs = [("v6", "desktop"), ("v6", "beauty"), ("v6", "gt3side"), ("v6", "ground")]
    elif "--v6" in sys.argv:
        jobs = [
            ("v6", "desktop"),
            ("v6", "beauty"),
            ("v6", "wide"),
            ("v6", "g90"),
            ("v6", "m4"),
            ("v6", "gt3"),
            ("v6", "ground"),
        ]
    elif "--v6-reel" in sys.argv:
        jobs = [("v6reel", "desktop")]
    elif "--v51-reel" in sys.argv:
        jobs = [("v51reel", "desktop")]
    elif "--v5-draft" in sys.argv:
        jobs = [("v5", "desktop"), ("v5", "mobile")]
    elif "--v5" in sys.argv:
        jobs = [
            ("v5", "desktop"),
            ("v5", "mobile"),
            ("v5", "g90"),
            ("v5", "m4"),
            ("v5", "gt3"),
            ("v5", "ground"),
            ("v5", "motion"),
        ]
    elif "--v4-desktop" in sys.argv:
        jobs = [("v4", "desktop")]
    elif "--v4-motion" in sys.argv:
        jobs = [("v4", "motion")]
    elif "--v4-draft" in sys.argv:
        jobs = [("v4", "desktop"), ("v4", "mobile"), ("v4", "gt3")]
    elif "--v4-gt3" in sys.argv:
        jobs = [("v4", "gt3")]
    elif "--v4" in sys.argv:
        jobs = [
            ("v4", "desktop"),
            ("v4", "mobile"),
            ("v4", "detail"),
            ("v4", "gt3"),
            ("v4", "motion"),
        ]
    out = Path("/workspace/assets/hero/renders/lineup-v2")
    out.mkdir(parents=True, exist_ok=True)

    clear()
    g90_objects = import_new(G90_SRC)
    # Clearcoat over a dielectric. v6 is a deeper burgundy, still a red paint.
    red = srgb_to_linear(
        "0E3F96" if v8_requested() else ("6C1528" if v7_requested() else ("9A1824" if v6_requested() else "B5121B"))
    )
    paint(
        "0.005",
        red,
        0.30 if v8_requested() else 0.0,
        0.24 if v8_requested() else (0.18 if v7_requested() else (0.26 if v6_requested() else 0.32)),
        coat=1.0,
        coat_rough=0.012 if v7_requested() else (0.02 if v6_requested() else 0.028),
    )
    paint("0.002", (0.015, 0.015, 0.016), 0.0, 0.55, coat=0.15, coat_rough=0.08)
    paint("0.003", (0.02, 0.02, 0.022), 0.0, 0.48, coat=0.2, coat_rough=0.08)
    hide_orbiting_duplicates(G90_FRONT + G90_REAR)
    g90_wb = wheelbase("WHEEL_LF", "WHEEL_LR")
    g90 = build_car(g90_objects, "G90", G90_FRONT, G90_REAR, Curve(G90_PATH))

    m4_objects = import_new(M4_SRC)
    drop_junk(m4_objects)
    m4_objects = [obj for obj in m4_objects if obj.name in bpy.data.objects]
    hide_orbiting_duplicates(M4_FRONT + M4_REAR)
    m4_wb = wheelbase("TIRE_LF_45", "TIRE_LR_44")
    m4 = build_car(m4_objects, "M4", M4_FRONT, M4_REAR, Curve(M4_PATH))
    gt3_objects = import_new(GT3_SRC)
    gt3 = build_gt3(gt3_objects, Curve(GT3_PATH))
    gt3_wb = gt3["wheelbase"]
    # #2E6A4C reads as British racing green under the studio banks. #234C3B turned black.
    green = srgb_to_linear("187A3C" if v8_requested() else ("1C8C4A" if v7_requested() else "2E6A4C"))
    paint(
        "bBMW_M4CompetitionG82TNR0_2021PaintTNR_Material_004",
        green,
        0.0,
        0.32 if v8_requested() else (0.46 if v7_requested() else (0.58 if v6_requested() else 0.55)),
        coat=0.72 if v8_requested() else (0.34 if v7_requested() else (0.22 if v6_requested() else 0.18)),
        coat_rough=0.06 if v8_requested() else (0.18 if v7_requested() else (0.32 if v6_requested() else 0.28)),
    )
    paint(
        "ext_red",
        green,
        0.0,
        0.30 if v8_requested() else (0.44 if v7_requested() else (0.56 if v6_requested() else 0.52)),
        coat=0.68 if v8_requested() else (0.3 if v7_requested() else (0.2 if v6_requested() else 0.16)),
        coat_rough=0.07 if v8_requested() else (0.2 if v7_requested() else (0.34 if v6_requested() else 0.3)),
    )
    if v6_requested():
        for mat_name in (
            "bBMW_M4CompetitionG82TNR0_2021PaintTNR_Material_004",
            "ext_red",
        ):
            mat = bpy.data.materials.get(mat_name)
            node = bsdf(mat)
            if node is not None and "Normal" in node.inputs:
                for link in list(node.inputs["Normal"].links):
                    mat.node_tree.links.remove(link)
    tune_named_materials()
    coat_gt3_body(gt3["rig"])
    boost_lamps()
    v4 = v4_requested() or v5_requested()
    if v4:
        neutral_bess_gt3(gt3["rig"])
        if v8_requested():
            darken_gt3_grille(gt3["rig"])
        if os.environ.get("GT3_DEBUG"):
            return
    if "--dump-gt3" in sys.argv:
        for image in bpy.data.images:
            print(f"IMG {image.name} {image.size[0]}x{image.size[1]}")
        for obj in bpy.context.scene.objects:
            if obj.type != "MESH":
                continue
            parent = obj
            while parent is not None and parent != gt3["rig"]:
                parent = parent.parent
            if parent != gt3["rig"]:
                continue
            _center, size = mesh_center(obj)
            mats = [slot.material.name for slot in obj.material_slots if slot.material]
            if max(size) > 0.25:
                print(
                    f"GT3MESH {obj.name} size={tuple(round(v, 2) for v in size)} mats={mats}"
                )
        return
    for label, car in (("g90", g90), ("m4", m4), ("gt3", gt3)):
        counts = [visible_wheel_meshes(hub) for hub in car["front"] + car["rear"]]
        print(f"WHEELS {label} {counts}")
    print(
        f"RADIUS g90={g90['radius']:.3f} m4={m4['radius']:.3f} gt3={gt3['radius']:.3f} "
        f"WB g90={g90_wb:.3f} m4={m4_wb:.3f} gt3={gt3_wb:.3f}"
    )
    parked, parked_yaw, _ = g90["curve"].at_time(G90_PATH["t1"])
    m4_parked, m4_yaw, _ = m4["curve"].at_time(M4_PATH["t1"])
    worst_m4 = 1e9
    worst_gt3 = 1e9
    for i in range(24):
        t = M4_PATH["t0"] + (M4_PATH["t1"] - M4_PATH["t0"]) * i / 23.0
        pos, yaw, _ = m4["curve"].at_time(t)
        worst_m4 = min(worst_m4, segment_gap(segment(parked, parked_yaw), segment(pos, yaw)))
        t = GT3_PATH["t0"] + (GT3_PATH["t1"] - GT3_PATH["t0"]) * i / 23.0
        pos, yaw, _ = gt3["curve"].at_time(t)
        worst_gt3 = min(
            worst_gt3,
            segment_gap(segment(parked, parked_yaw), segment(pos, yaw)),
            segment_gap(segment(m4_parked, m4_yaw), segment(pos, yaw)),
        )
    print(f"CLEARANCE m4 {worst_m4:.2f} gt3 {worst_gt3:.2f}")

    if v6_requested():
        for car, prefix in ((g90, "G90"), (m4, "M4"), (gt3, "GT3")):
            car["tails"] = add_tail_spots(car["rig"], prefix)
    if v5_requested():
        plant_car(g90, g90["radius"], g90_wb)
        plant_car(m4, m4["radius"], m4_wb)
        plant_car(gt3, gt3["radius"], gt3_wb)
    if v6_requested():
        level_gt3_shell(gt3)
        pack_lineup(g90, m4, gt3, g90_wb, m4_wb, gt3_wb)
        audit_arrivals(g90, m4, gt3, g90_wb, m4_wb, gt3_wb)
        if v8_requested():
            add_contour(m4, srgb_to_linear("18F06A"), "M4", energy=150.0)
            add_contour(g90, srgb_to_linear("2F74FF"), "G90", energy=175.0)
            add_contour(gt3, srgb_to_linear("E01430"), "GT3", energy=185.0)
        elif v7_requested():
            add_contour(m4, srgb_to_linear("18F06A"), "M4", energy=90.0)
            add_contour(g90, srgb_to_linear("D01238"), "G90", energy=105.0)
            add_contour(gt3, srgb_to_linear("D01238"), "GT3", energy=120.0)
        else:
            add_contour(m4, srgb_to_linear("1C8F45"), "M4")
            add_contour(g90, srgb_to_linear("C4162A"), "G90")
            add_contour(gt3, srgb_to_linear("8A2444"), "GT3", energy=26.0)
    receivers = [obj for obj in bpy.context.scene.objects if obj.type == "MESH"]
    studio(0.0, receivers)
    keyframes = [
        ("00-empty", 0.0, True),
        ("01-g90-arc", 1.7, False),
        ("02-g90-center", 3.5, False),
        ("03-m4-entry", 4.8, False),
        ("04-both", 6.2, False),
        ("05-gt3-entry", 7.3, False),
        ("06-trio", DURATION, False),
        ("07-wheels", DURATION, False),
    ]
    if "--trio" in sys.argv:
        keyframes = [("06-trio", DURATION, False), ("07-wheels", DURATION, False)]
    cycles = "--cycles" in sys.argv
    for job, view in jobs:
        frame_camera(view)
        if job == "preview":
            shots = [shot for shot in keyframes if view == "desktop" or not shot[0].startswith("07")]
            scene = configure_scene(1280 if view == "desktop" else 720, 720 if view == "desktop" else 1280, 16, False)
            folder = out / view
        elif job == "animatic":
            shots = [(f"frame_{i:03d}", i / FPS, i == 0) for i in range(int(DURATION * FPS))]
            if view == "desktop":
                scene = configure_scene(1280, 720, 8, False)
            else:
                scene = configure_scene(720, 1280, 8, False)
            folder = out / f"animatic-{view}"
        elif job == "stills":
            shots = [shot for shot in keyframes if shot[0] in {"06-trio", "07-wheels"}]
            if view == "mobile":
                shots = [shot for shot in shots if shot[0] == "06-trio"]
            samples = 40 if cycles else 24
            if view == "desktop":
                scene = configure_scene(1600, 900, samples, cycles)
            else:
                scene = configure_scene(900, 1600, samples, cycles)
            folder = out / f"stills-{view}"
        elif job == "quality":
            shots = [("06-trio", DURATION, False)]
            if view == "desktop":
                scene = configure_scene(1920, 1080, 32, True)
            else:
                draft = "--draft" in sys.argv
                scene = configure_scene(
                    540 if draft else 1080,
                    960 if draft else 1920,
                    8 if draft else 32,
                    True,
                )
            folder = out / f"quality-{view}"
        elif job in {"v7ee", "v8ee"}:
            shots = [("check", DURATION, False)]
            scene = configure_scene(1200, 675, 8, False)
            scene.eevee.use_bloom = False
            scene.eevee.use_ssr = False
            folder = out / f"{'v8' if job == 'v8ee' else 'v7'}-ee-{view}"
        elif job in {"v7reel", "v8reel"}:
            shots = [(f"f{i:04d}", i / FPS, False) for i in range(int(DURATION * FPS))]
            scene = configure_scene(640, 360, 4, False)
            scene.eevee.use_bloom = False
            scene.eevee.use_ssr = False
            folder = out / ("v8-reel" if job == "v8reel" else "v7-reel")
        elif job in {"v7", "v8"}:
            samples = 40
            if view in {"desktop", "beauty"}:
                shots = [("06-trio" if view == "desktop" else "beauty", DURATION, False)]
                scene = configure_scene(1920, 1080, samples, True)
            elif view == "wide":
                shots = [("wide", DURATION, False)]
                scene = configure_scene(1600, 900, samples, True)
            elif view == "ground":
                shots = [("contacts", DURATION, False)]
                scene = configure_scene(1280, 720, 28, True)
            elif view in {"glow", "lamps"}:
                shots = [(view, DURATION, False)]
                scene = configure_scene(1600, 900, 32, True)
            else:
                shots = [(view, DURATION, False)]
                scene = configure_scene(1400, 788, 32, True)
            folder = out / f"{job}-{view}"
        elif job == "v6ee":
            shots = [("check", DURATION, False)]
            scene = configure_scene(1100, 620, 8, False)
            scene.eevee.use_bloom = False
            folder = out / f"v6-ee-{view}"
        elif job == "v6reel":
            shots = [(f"f{i:04d}", i / FPS, False) for i in range(int((DURATION + 1.0) * FPS))]
            scene = configure_scene(640, 360, 4, False)
            scene.eevee.use_bloom = False
            scene.eevee.use_ssr = False
            folder = out / "v6-reel"
        elif job == "v6":
            draft = "--v6-draft" in RENDER_FLAGS
            samples = 16 if draft else 48
            wide_s = 16 if draft else 48
            if view == "desktop":
                shots = [("06-trio", DURATION, False)]
                scene = configure_scene(960 if draft else 1920, 540 if draft else 1080, samples, True)
                folder = out / ("v6-draft-desktop" if draft else "v6-desktop")
            elif view == "beauty":
                shots = [("beauty", DURATION, False)]
                scene = configure_scene(960 if draft else 1920, 540 if draft else 1080, samples, True)
                folder = out / ("v6-draft-beauty" if draft else "v6-beauty")
            elif view == "wide":
                shots = [("wide", DURATION, False)]
                scene = configure_scene(960 if draft else 1600, 540 if draft else 900, wide_s, True)
                folder = out / ("v6-draft-wide" if draft else "v6-wide")
            elif view == "gt3side":
                shots = [("side", DURATION, False)]
                scene = configure_scene(1280, 720, 16 if draft else 32, True)
                folder = out / ("v6-draft-gt3side" if draft else "v6-gt3side")
            elif view == "ground":
                shots = [("contacts", DURATION, False)]
                scene = configure_scene(1280, 720, 16 if draft else 32, True)
                folder = out / ("v6-draft-ground" if draft else "v6-ground")
            elif view == "g90":
                shots = [("g90", DURATION, False)]
                scene = configure_scene(960 if draft else 1400, 540 if draft else 788, samples, True)
                folder = out / ("v6-draft-g90" if draft else "v6-g90")
            elif view == "m4":
                shots = [("m4", DURATION, False)]
                scene = configure_scene(960 if draft else 1400, 540 if draft else 788, samples, True)
                folder = out / ("v6-draft-m4" if draft else "v6-m4")
            else:
                shots = [("gt3", DURATION, False)]
                scene = configure_scene(960 if draft else 1400, 540 if draft else 788, samples, True)
                folder = out / ("v6-draft-gt3" if draft else "v6-gt3")
        elif job == "v51reel":
            # Continuous Eevee preview. Not the Cycles film.
            shots = [(f"f{i:04d}", i / FPS, False) for i in range(int(12 * FPS))]
            scene = configure_scene(640, 360, 4, False)
            scene.eevee.use_bloom = False
            scene.eevee.use_ssr = False
            folder = out / "v51-reel"
        elif job == "v5":
            draft = "--v5-draft" in RENDER_FLAGS or "--v51-draft" in RENDER_FLAGS
            if view == "desktop":
                shots = [("06-trio", DURATION, False)]
                scene = configure_scene(
                    960 if draft else 1920,
                    540 if draft else 1080,
                    16 if draft else (64 if "--v51" in RENDER_FLAGS else 128),
                    True,
                )
                folder = out / ("v51-draft-desktop" if "--v51-draft" in RENDER_FLAGS else ("v5-draft-desktop" if draft else "v51-desktop" if "--v51" in RENDER_FLAGS else "v5-desktop"))
            elif view == "mobile":
                shots = [("06-trio", DURATION, False)]
                scene = configure_scene(540 if draft else 1080, 960 if draft else 1920, 16 if draft else 128, True)
                folder = out / ("v5-draft-mobile" if draft else "v5-mobile")
            elif view == "wide":
                shots = [("wide", DURATION, False)]
                scene = configure_scene(960 if draft else 1600, 540 if draft else 900, 16 if draft else 64, True)
                folder = out / ("v51-draft-wide" if draft else "v51-wide")
            elif view == "gt3side":
                shots = [("side", DURATION, False)]
                scene = configure_scene(1280, 720, 16 if draft else 32, True)
                folder = out / ("v51-draft-gt3side" if draft else "v51-gt3side")
            elif view == "ground":
                shots = [("contacts", DURATION, False)]
                scene = configure_scene(1280, 720, 16 if draft else 48, True)
                folder = out / ("v5-draft-ground" if draft else "v5-ground")
            elif view == "g90":
                shots = [("g90", DURATION, False)]
                scene = configure_scene(960 if draft else 1400, 540 if draft else 788, 16 if draft else 64, True)
                folder = out / ("v51-draft-g90" if draft else "v51-g90")
            elif view == "m4":
                shots = [("m4", DURATION, False)]
                scene = configure_scene(1400, 788, 64, True)
                folder = out / "v5-m4"
            elif view == "gt3":
                shots = [("gt3", DURATION, False)]
                scene = configure_scene(960 if draft else 1400, 540 if draft else 788, 16 if draft else 64, True)
                folder = out / ("v5-draft-gt3" if draft else "v5-gt3")
            else:
                shots = [
                    ("m01", 1.4, False),
                    ("m02", 2.6, False),
                    ("m03", 3.3, False),
                    ("m04", 4.8, False),
                    ("m05", 6.0, False),
                    ("m06", 7.3, False),
                    ("m07", 8.4, False),
                    ("m08", 9.0, False),
                ]
                scene = configure_scene(1280, 720, 16, True)
                folder = out / "v5-motion"
        elif job == "v4":
            draft = "--v4-draft" in RENDER_FLAGS
            if view == "desktop":
                shots = [("06-trio", DURATION, False)]
                scene = configure_scene(960 if draft else 1920, 540 if draft else 1080, 16 if draft else 128, True)
                folder = out / ("v4-draft-desktop" if draft else "v4-desktop")
            elif view == "mobile":
                shots = [("06-trio", DURATION, False)]
                scene = configure_scene(540 if draft else 1080, 960 if draft else 1920, 16 if draft else 128, True)
                folder = out / ("v4-draft-mobile" if draft else "v4-mobile")
            elif view == "detail":
                shots = [("detail", DURATION, False)]
                scene = configure_scene(1600, 900, 96, True)
                folder = out / "v4-detail"
            elif view == "gt3":
                shots = [("gt3-neutral", DURATION, False)]
                scene = configure_scene(960 if draft else 1600, 540 if draft else 900, 16 if draft else 64, True)
                folder = out / ("v4-draft-gt3" if draft else "v4-gt3")
            else:
                shots = [
                    ("m01-g90-steer", 1.55, False),
                    ("m02-g90-brake", 2.7, False),
                    ("m02b-axle", 2.7, False),
                    ("m03-m4-steer", 4.7, False),
                    ("m04-gt3-steer", 7.25, False),
                    ("m05-trio", DURATION, False),
                ]
                scene = configure_scene(1280, 720, 32, True)
                folder = out / "v4-motion"
        elif job == "axle":
            shots = [("m02b-axle", 2.7, False)]
            scene = configure_scene(1280, 720, 24, True)
            folder = out / "motion"
        else:
            shots = [
                ("m01-g90-steer", 1.55, False),
                ("m01b-wheels", 1.55, False),
                ("m02-g90-brake", 2.7, False),
                ("m03-m4-steer", 4.7, False),
                ("m04-gt3-steer", 7.25, False),
                ("m05-trio", DURATION, False),
            ]
            scene = configure_scene(1280, 720, 16, True)
            folder = out / "motion"
        folder.mkdir(parents=True, exist_ok=True)
        for name, t, empty in shots:
            frame_camera("wheels" if "wheels" in name else view)
            hide_tree(g90["rig"], empty or t < G90_PATH["t0"])
            hide_tree(m4["rig"], empty or t < M4_PATH["t0"])
            hide_tree(gt3["rig"], empty or t < GT3_PATH["t0"])
            if not empty and t >= G90_PATH["t0"]:
                steer, dist = place(g90, t, g90["radius"], g90_wb)
            else:
                steer, dist = 0.0, 0.0
            if not empty and t >= M4_PATH["t0"]:
                m4_steer, m4_dist = place(m4, t, m4["radius"], m4_wb)
            else:
                m4_steer, m4_dist = 0.0, 0.0
            if not empty and t >= GT3_PATH["t0"]:
                gt3_steer, gt3_dist = place(gt3, t, gt3["radius"], gt3_wb)
            else:
                gt3_steer, gt3_dist = 0.0, 0.0
            if view == "gt3" or view == "gt3side":
                hide_tree(g90["rig"], True)
                hide_tree(m4["rig"], True)
            elif view == "g90":
                hide_tree(m4["rig"], True)
                hide_tree(gt3["rig"], True)
            elif view == "m4":
                hide_tree(g90["rig"], True)
                hide_tree(gt3["rig"], True)
            bpy.context.view_layer.update()
            if job in {"v6", "v6ee", "v7", "v7ee", "v8", "v8ee"} and view == "g90":
                aim_beauty(g90, (0.15, -3.2, 0.5), (-0.05, 0.45, 0.34), 46)
            elif job in {"v6", "v6ee", "v7", "v7ee", "v8", "v8ee"} and view == "m4":
                aim_front(m4, 1.35, 38)
            elif job in {"v7", "v7ee", "v8", "v8ee"} and view == "lamps":
                aim_beauty(g90, (0.15, -3.2, 0.48), (-0.05, 0.35, 0.32), 52)
            elif job in {"v6", "v6ee", "v7", "v7ee", "v8", "v8ee"} and view == "gt3":
                aim_front(gt3, -0.85, 48)
            elif job == "v6" and view == "gt3side":
                origin = gt3["rig"].matrix_world.translation
                yaw = gt3["curve"].at_time(DURATION)[1]
                side = Vector((math.cos(yaw), math.sin(yaw), 0.0))
                cam = bpy.data.objects["HeroCam"]
                cam.data.lens = 65
                cam.data.shift_x = 0.0
                cam.data.shift_y = 0.0
                cam.location = origin + side * 6.2 + Vector((0.0, 0.0, 0.06))
                look_at(cam, origin + Vector((0.0, 0.0, 0.08)))
            elif job == "v5" and view == "g90":
                # Front three-quarter: paint, the near wheel, the lamp, and the glass.
                cam = bpy.data.objects["HeroCam"]
                cam.data.lens = 42
                cam.data.shift_x = 0.0
                cam.data.shift_y = 0.0
                cam.location = Vector((-0.05, -3.35, 0.58))
                look_at(cam, Vector((-0.95, -0.95, 0.42)))
            elif job == "v5" and view == "gt3side":
                origin = gt3["rig"].matrix_world.translation
                yaw = gt3["curve"].at_time(DURATION)[1]
                side = Vector((math.cos(yaw), math.sin(yaw), 0.0))
                cam = bpy.data.objects["HeroCam"]
                cam.data.lens = 65
                cam.data.shift_x = 0.0
                cam.data.shift_y = 0.0
                cam.location = origin + side * 6.4 + Vector((0.0, 0.0, 0.08))
                look_at(cam, origin + Vector((0.0, 0.0, 0.08)))
            elif job == "v5" and view == "m4":
                aim_beauty(m4, (1.7, -3.7, 0.95), (0.05, 0.35, 0.4), 52)
            elif job == "v5" and view == "gt3":
                aim_beauty(gt3, (-2.6, -3.6, 0.7), (-0.4, 0.7, 0.32), 46)
            if view in {"ground", "gt3side"}:
                show_contacts((g90, m4, gt3), True)
            else:
                show_contacts((g90, m4, gt3), False)
            if "axle" in name:
                aim_nearest_front(g90)
            elif view == "detail" or name == "detail":
                aim_g90_detail(g90)
            bpy.context.view_layer.update()
            scene.render.filepath = str(folder / name)
            started = time.perf_counter()
            bpy.ops.render.render(write_still=True)
            elapsed = time.perf_counter() - started
            print(
                f"FRAME {job} {view} {name} t={t:.2f} {elapsed:.1f}s "
                f"g90={math.degrees(steer):.1f}/{dist:.1f} "
                f"m4={math.degrees(m4_steer):.1f}/{m4_dist:.1f} "
                f"gt3={math.degrees(gt3_steer):.1f}/{gt3_dist:.1f}"
            )
    print("DONE", out)


if __name__ == "__main__":
    main()
