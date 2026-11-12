"""Two-car studio animatic for the BESS hero.

G90 (JUST GAME, CC BY) arcs in from the right and stops in the center.
M4 Widebody (VTDAT23, CC BY) then arcs in from the left and stops behind-left.
The right-rear mark is reserved for a future M4 GT3. The VTX CC BY-NC-SA file
is not imported. Blender 4.0 Eevee. Nose is local -Y, axle is local X.

  blender -b -P scripts/cinematic-hero/render_lineup.py -- --preview
  blender -b -P scripts/cinematic-hero/render_lineup.py -- --animatic
  blender -b -P scripts/cinematic-hero/render_lineup.py -- --stills
"""

import math
import sys
from pathlib import Path

import bpy
from mathutils import Matrix, Quaternion, Vector

G90_SRC = "/workspace/assets/hero/source/g90/bmw-g90-m5-justgame.glb"
M4_SRC = "/workspace/assets/hero/source/m4-widebody/bmw-m4-widebody.glb"
# Forbidden in this shot: assets/hero/source/m4-gt3/bmw-m4-gt3-evo.glb (CC BY-NC-SA).

G90_FRONT = ("WHEEL_LF", "WHEEL_RF")
G90_REAR = ("WHEEL_LR", "WHEEL_RR")
M4_FRONT = ("TIRE_LF_45", "TIRE_RF_43")
M4_REAR = ("TIRE_LR_44", "TIRE_RR_42")

# Headings are degrees. 0 looks down -Y (toward the camera). Negative turns the
# nose toward screen-left. The end heading is the tangent, so the car does not crab.
G90_PATH = {
    "p0": (12.6, 4.6),
    "h0": -68.0,
    "p3": (0.15, 0.35),
    "h3": -46.0,
    "l1": 5.0,
    "l2": 5.8,
    "t0": 0.35,
    "t1": 4.05,
}
M4_PATH = {
    "p0": (-14.4, 5.4),
    "h0": 84.0,
    "p3": (-5.15, 3.45),
    "h3": 58.0,
    "l1": 4.6,
    "l2": 4.2,
    "t0": 4.45,
    "t1": 7.45,
}
# Empty mark, screen-right and behind the parked G90, clear of both driven paths.
# The entry below is reserved for a checked CC BY GT3. Nothing is spawned from it.
GT3_SLOT = (4.55, 5.35)
GT3_HEADING = -70.0
GT3_ENTRY = {
    "p0": (16.0, 8.2),
    "h0": -80.0,
    "p3": GT3_SLOT,
    "h3": GT3_HEADING,
    "l1": 4.5,
    "l2": 4.0,
}
DURATION = 8.0


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


def paint(name, color, metallic, roughness, coat=1.0):
    node = bsdf(bpy.data.materials.get(name))
    if node is None:
        return
    node.inputs["Base Color"].default_value = (*color, 1.0)
    node.inputs["Metallic"].default_value = metallic
    node.inputs["Roughness"].default_value = roughness
    if "Coat Weight" in node.inputs:
        node.inputs["Coat Weight"].default_value = coat
    if "Coat Roughness" in node.inputs:
        node.inputs["Coat Roughness"].default_value = 0.05
    if "Emission Strength" in node.inputs:
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
    aim = Vector((0.0, -1.0, -0.08)).to_track_quat("-Z", "Y").to_euler()
    for side, x in (("L", 0.72), ("R", -0.72)):
        light = bpy.data.lights.new(f"{prefix}_{side}", "SPOT")
        light.energy = 0.0
        light.spot_size = math.radians(26)
        light.spot_blend = 0.45
        light.color = (0.86, 0.91, 1.0)
        light.use_shadow = False
        obj = bpy.data.objects.new(light.name, light)
        bpy.context.scene.collection.objects.link(obj)
        obj.parent = rig
        obj.matrix_parent_inverse = Matrix.Identity(4)
        obj.location = Vector((x, -2.15, 0.22))
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


def studio(floor_z):
    world = bpy.data.worlds.new("Studio")
    bpy.context.scene.world = world
    world.use_nodes = True
    bg = world.node_tree.nodes["Background"]
    bg.inputs[0].default_value = (0.010, 0.011, 0.014, 1.0)
    bg.inputs[1].default_value = 0.35

    bpy.ops.mesh.primitive_plane_add(size=160, location=(0.0, 4.0, floor_z))
    floor = bpy.context.active_object
    floor.name = "Floor"
    mat = bpy.data.materials.new("Floor")
    mat.use_nodes = True
    node = mat.node_tree.nodes["Principled BSDF"]
    node.inputs["Base Color"].default_value = (0.016, 0.017, 0.020, 1.0)
    node.inputs["Roughness"].default_value = 0.55
    node.inputs["Metallic"].default_value = 0.0
    floor.data.materials.append(mat)

    def area(name, location, energy, color, size):
        light = bpy.data.lights.new(name, "AREA")
        light.energy = energy
        light.color = color
        light.size = size
        obj = bpy.data.objects.new(name, light)
        bpy.context.scene.collection.objects.link(obj)
        obj.location = location
        look_at(obj, Vector((0.0, 1.2, 0.6)))

    area("Key", Vector((2.4, -3.5, 7.2)), 420, (0.93, 0.95, 1.0), 10.0)
    area("Fill", Vector((-6.5, -1.5, 3.4)), 110, (0.70, 0.76, 0.88), 8.0)
    area("Rim", Vector((1.2, 8.0, 3.6)), 80, (0.75, 0.82, 1.0), 6.0)
    sun_data = bpy.data.lights.new("Sun", "SUN")
    sun_data.energy = 2.4
    sun_data.use_shadow = True
    sun_data.angle = math.radians(7.0)
    sun = bpy.data.objects.new("Sun", sun_data)
    bpy.context.scene.collection.objects.link(sun)
    sun.rotation_euler = (math.radians(54), 0.0, math.radians(24))

    cam_data = bpy.data.cameras.new("HeroCam")
    cam_data.lens = 28
    cam = bpy.data.objects.new("HeroCam", cam_data)
    bpy.context.scene.collection.objects.link(cam)
    bpy.context.scene.camera = cam
    cam.location = Vector((0.15, -8.6, 1.48))
    look_at(cam, Vector((-0.55, 1.15, 0.58)))
    return cam


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
        light.energy = 420.0 * lamp
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


def configure_scene(width, height, samples):
    scene = bpy.context.scene
    scene.render.engine = "BLENDER_EEVEE"
    scene.render.resolution_x = width
    scene.render.resolution_y = height
    scene.render.film_transparent = False
    scene.eevee.taa_render_samples = samples
    scene.eevee.use_bloom = True
    scene.eevee.bloom_intensity = 0.015
    scene.eevee.use_ssr = True
    scene.view_settings.view_transform = "AgX"
    scene.view_settings.look = "AgX - Medium High Contrast"
    scene.view_settings.exposure = 0.12
    return scene


def wheelbase(front_name, rear_name):
    a = bpy.data.objects[front_name].matrix_world.translation
    b = bpy.data.objects[rear_name].matrix_world.translation
    return (a - b).length


def main():
    preview = "--preview" in sys.argv
    animatic = "--animatic" in sys.argv
    stills = "--stills" in sys.argv
    if not (preview or animatic or stills):
        preview = True
    jobs = []
    if preview:
        jobs.append("preview")
    if stills:
        jobs.append("stills")
    if animatic:
        jobs.append("animatic")
    out = Path("/workspace/assets/hero/renders/lineup")
    out.mkdir(parents=True, exist_ok=True)

    clear()
    g90_objects = import_new(G90_SRC)
    paint("0.005", (0.011, 0.012, 0.014), 0.78, 0.22)
    paint("0.002", (0.008, 0.008, 0.009), 0.35, 0.38, coat=0.4)
    paint("0.003", (0.01, 0.01, 0.011), 0.05, 0.55, coat=0.0)
    hide_orbiting_duplicates(G90_FRONT + G90_REAR)
    g90_wb = wheelbase("WHEEL_LF", "WHEEL_LR")
    g90 = build_car(g90_objects, "G90", G90_FRONT, G90_REAR, Curve(G90_PATH))

    m4_objects = import_new(M4_SRC)
    drop_junk(m4_objects)
    m4_objects = [obj for obj in m4_objects if obj.name in bpy.data.objects]
    hide_orbiting_duplicates(M4_FRONT + M4_REAR)
    m4_wb = wheelbase("TIRE_LF_45", "TIRE_LR_44")
    m4 = build_car(m4_objects, "M4", M4_FRONT, M4_REAR, Curve(M4_PATH))
    print(
        f"RADIUS g90={g90['radius']:.3f} m4={m4['radius']:.3f} "
        f"WB g90={g90_wb:.3f} m4={m4_wb:.3f} "
        f"PATH g90={g90['curve'].total:.2f}m m4={m4['curve'].total:.2f}m"
    )
    print(f"GT3_SLOT {GT3_SLOT} heading {GT3_HEADING}")

    # Clearance while the M4 is driving and the G90 is already parked.
    parked, parked_yaw, _ = g90["curve"].at_time(G90_PATH["t1"])
    worst = 1e9
    for i in range(25):
        t = M4_PATH["t0"] + (M4_PATH["t1"] - M4_PATH["t0"]) * i / 24.0
        pos, yaw, _ = m4["curve"].at_time(t)
        gap = segment_gap(segment(parked, parked_yaw), segment(pos, yaw))
        worst = min(worst, gap)
    print(f"CLEARANCE centerline {worst:.2f} m")

    studio(0.0)
    for job in jobs:
        if job == "preview":
            shots = [
                ("00-empty", 0.0, True),
                ("01-g90-arc", 2.15, False),
                ("02-g90-center", 4.25, False),
                ("03-m4-entry", 5.85, False),
                ("04-both", 8.0, False),
                ("05-composition", 8.0, False),
            ]
            scene = configure_scene(1280, 720, 10)
            folder = out
        elif job == "animatic":
            shots = [(f"frame_{i:03d}", i / 8.0, i == 0) for i in range(int(DURATION * 8))]
            scene = configure_scene(960, 540, 6)
            folder = out / "animatic"
            folder.mkdir(parents=True, exist_ok=True)
        else:
            shots = [
                ("00-empty", 0.0, True),
                ("01-g90-arc", 2.15, False),
                ("02-g90-center", 4.25, False),
                ("03-m4-entry", 5.85, False),
                ("04-both", 8.0, False),
                ("05-composition", 8.0, False),
            ]
            scene = configure_scene(1400, 788, 24)
            folder = out / "stills"
            folder.mkdir(parents=True, exist_ok=True)

        for name, t, empty in shots:
            hide_tree(g90["rig"], empty or t < G90_PATH["t0"])
            hide_tree(m4["rig"], empty or t < M4_PATH["t0"])
            if not empty and t >= G90_PATH["t0"]:
                steer, dist = place(g90, t, g90["radius"], g90_wb)
            else:
                steer, dist = 0.0, 0.0
            if not empty and t >= M4_PATH["t0"]:
                m4_steer, m4_dist = place(m4, t, m4["radius"], m4_wb)
            else:
                m4_steer, m4_dist = 0.0, 0.0
            bpy.context.view_layer.update()
            scene.render.filepath = str(folder / name)
            bpy.ops.render.render(write_still=True)
            print(
                f"FRAME {job} {name} t={t:.2f} g90_steer={math.degrees(steer):.1f} "
                f"g90_dist={dist:.2f} m4_steer={math.degrees(m4_steer):.1f} m4_dist={m4_dist:.2f}"
            )
    print("DONE", out)


if __name__ == "__main__":
    main()
