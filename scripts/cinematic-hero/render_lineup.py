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
    "p3": (-2.95, 2.25),
    "h3": -18.0,
    "l1": 4.2,
    "l2": 3.0,
    "t0": 3.55,
    "t1": 6.05,
}
GT3_PATH = {
    "p0": (11.4, 5.2),
    "h0": -74.0,
    "p3": (5.5, 2.9),
    "h3": -50.0,
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
    aim = Vector((0.0, -1.0, -0.02)).to_track_quat("-Z", "Y").to_euler()
    for side, x in (("L", 0.72), ("R", -0.72)):
        light = bpy.data.lights.new(f"{prefix}_{side}", "SPOT")
        light.energy = 0.0
        light.spot_size = math.radians(18)
        light.spot_blend = 0.6
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
    ramp.color_ramp.elements[0].position = 0.35
    ramp.color_ramp.elements[0].color = (0.004, 0.004, 0.005, 1.0)
    ramp.color_ramp.elements[1].position = 0.72
    ramp.color_ramp.elements[1].color = (0.018, 0.019, 0.022, 1.0)
    links.new(geom.outputs["Incoming"], sep.inputs["Vector"])
    links.new(sep.outputs["Z"], ramp.inputs["Fac"])
    links.new(ramp.outputs["Color"], bg.inputs["Color"])
    bg.inputs["Strength"].default_value = 0.12
    links.new(bg.outputs["Background"], out.inputs["Surface"])

    bpy.ops.mesh.primitive_plane_add(size=160, location=(0.0, 4.0, floor_z))
    floor = bpy.context.active_object
    floor.name = "Floor"
    mat = bpy.data.materials.new("Floor")
    mat.use_nodes = True
    node = mat.node_tree.nodes["Principled BSDF"]
    node.inputs["Base Color"].default_value = (0.012, 0.0125, 0.014, 1.0)
    node.inputs["Roughness"].default_value = 0.48
    node.inputs["Metallic"].default_value = 0.0
    node.inputs["Specular IOR Level"].default_value = 0.28
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

    aim = Vector((0.2, 1.05, 0.72))
    # A wide bank, not a thin strip. The old 1.35 m key clipped every upward panel.
    area("Key", Vector((-4.4, -4.6, 4.4)), 150, (1.0, 0.97, 0.94), 7.2, aim, size_y=3.8, link=True)
    area("Fill", Vector((3.8, -2.8, 2.1)), 110, (0.86, 0.9, 0.98), 6.0, aim, size_y=3.2, link=True)
    area("RimL", Vector((-5.6, 4.2, 1.9)), 150, (0.82, 0.88, 1.0), 3.6, Vector((-2.2, 1.6, 0.85)), size_y=1.8, link=True)
    area("RimR", Vector((7.2, 4.0, 2.0)), 140, (1.0, 0.94, 0.88), 3.6, Vector((4.2, 1.8, 0.85)), size_y=1.8, link=True)
    area("Face", Vector((0.2, -6.8, 1.35)), 70, (1.0, 0.98, 0.95), 5.0, aim, link=True)
    # Soft contact shadow. This one also reaches the floor.
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


def frame_camera(kind):
    cam = bpy.data.objects["HeroCam"]
    cam.data.shift_x = 0.0
    cam.data.shift_y = 0.0
    cam.data.sensor_fit = "HORIZONTAL"
    if kind == "mobile":
        # Closer three-quarter. The upper third stays empty for the hero type.
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
    else:
        # Closer, and shifted so the trio sits right of the homepage headline.
        # Wide enough that the trio sits in the right half, clear of the headline.
        cam.data.lens = 28
        cam.data.shift_x = -0.24
        cam.location = Vector((-2.4, -12.4, 1.2))
        look_at(cam, Vector((1.35, 1.5, 0.58)))


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
    pitch = max(-math.radians(1.0), min(math.radians(2.3), -accel * 0.016))
    roll = max(-math.radians(1.6), min(math.radians(1.6), -steer * 0.28))
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
    for light in car["spots"]:
        light.energy = 70.0 * lamp
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
    node.inputs["Metallic"].default_value = 0.0
    if os.environ.get("GT3_DEBUG") and mat.name in {"mat_64", "mat_9", "mat_63", "mat_30"}:
        color_now = tuple(round(v, 3) for v in node.inputs["Base Color"].default_value)
        print("RECOLOR", mat.name, "linked", node.inputs["Base Color"].is_linked, "color", color_now)
    if not node.inputs["Roughness"].is_linked:
        node.inputs["Roughness"].default_value = 0.32
    if "Coat Weight" in node.inputs:
        node.inputs["Coat Weight"].default_value = 1.0
        node.inputs["Coat Roughness"].default_value = 0.055
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
    node.inputs["Roughness"].default_value = 0.06
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


def neutral_bess_gt3(rig):
    """Recolour the race body. Decal cards that only carry sponsor art are hidden.

    Removing those logos does not clear the vehicle design or the BMW trademarks.
    """
    cache = {}
    painted = 0
    hidden = 0
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


def configure_scene(width, height, samples, cycles):
    scene = bpy.context.scene
    scene.render.resolution_x = width
    scene.render.resolution_y = height
    scene.render.film_transparent = False
    scene.view_settings.view_transform = "AgX"
    scene.view_settings.look = "AgX - Base Contrast"
    v4_look = v4_requested()
    scene.view_settings.exposure = -0.15 if v4_look else 0.35
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
    if "--v4-desktop" in sys.argv:
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
    paint("0.005", (0.008, 0.0085, 0.01), 0.0, 0.38, coat=1.0, coat_rough=0.022)
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
    paint(
        "bBMW_M4CompetitionG82TNR0_2021PaintTNR_Material_004",
        (0.18, 0.008, 0.006),
        0.0,
        0.4,
        coat=1.0,
        coat_rough=0.03,
    )
    paint("ext_red", (0.26, 0.012, 0.008), 0.0, 0.38, coat=0.8, coat_rough=0.045)
    tune_named_materials()
    coat_gt3_body(gt3["rig"])
    boost_lamps()
    v4 = v4_requested()
    if v4:
        neutral_bess_gt3(gt3["rig"])
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
            if view == "gt3":
                hide_tree(g90["rig"], True)
                hide_tree(m4["rig"], True)
            bpy.context.view_layer.update()
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
