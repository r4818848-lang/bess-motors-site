"""Black Sapphire G90 arrival. Contact sheet by default; full 96 frames with --full.

The GLB stays on disk and is not published from this script.
Blender 4.0, Eevee. Nose is -Y, axle is X. WHEEL_* empties spin on local X.
"""

import math
import sys
from pathlib import Path

import bmesh
import bpy
from mathutils import Vector

SRC = "/workspace/assets/hero/source/g90/bmw-g90-m5-justgame.glb"
FPS = 24
DURATION = 4.0
TRAVEL = 9.2
WHEEL_NAMES = ("WHEEL_RF", "WHEEL_LF", "WHEEL_LR", "WHEEL_RR")


def clear():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete()


def bounds(objects):
    low = Vector((1e9, 1e9, 1e9))
    high = Vector((-1e9, -1e9, -1e9))
    for obj in objects:
        if obj.type != "MESH":
            continue
        for corner in obj.bound_box:
            point = obj.matrix_world @ Vector(corner)
            low = Vector((min(low.x, point.x), min(low.y, point.y), min(low.z, point.z)))
            high = Vector((max(high.x, point.x), max(high.y, point.y), max(high.z, point.z)))
    return low, high


def look_at(obj, target):
    obj.rotation_euler = (target - obj.location).to_track_quat("-Z", "Y").to_euler()


def bsdf(mat):
    if not mat or not mat.use_nodes:
        return None
    return next((node for node in mat.node_tree.nodes if node.type == "BSDF_PRINCIPLED"), None)


def paint(name, color, metallic, roughness, coat=1.0):
    node = bsdf(bpy.data.materials.get(name))
    if node is None:
        return
    node.inputs["Base Color"].default_value = (*color, 1)
    node.inputs["Metallic"].default_value = metallic
    node.inputs["Roughness"].default_value = roughness
    if "Coat Weight" in node.inputs:
        node.inputs["Coat Weight"].default_value = coat
    if "Coat Roughness" in node.inputs:
        node.inputs["Coat Roughness"].default_value = 0.05
    if "Emission Strength" in node.inputs:
        node.inputs["Emission Strength"].default_value = 0.0


def smooth(u):
    u = min(1.0, max(0.0, u))
    return u * u * (3.0 - 2.0 * u)


def remaining(t):
    """Meters still to travel. 0 means the car is on its mark."""
    if t <= 1.0:
        return TRAVEL * (1.0 - 0.40 * smooth(t / 1.0))
    if t <= 2.5:
        return TRAVEL * (1.0 - (0.40 + 0.42 * smooth((t - 1.0) / 1.5)))
    if t <= 3.5:
        return TRAVEL * (1.0 - (0.82 + 0.18 * (1.0 - (1.0 - (t - 2.5)) ** 3)))
    return 0.0


def pitch_deg(t):
    if t < 2.35:
        return 0.0
    if t < 3.15:
        return 2.3 * math.sin((t - 2.35) / 0.80 * math.pi * 0.5)
    if t < 3.85:
        return 2.3 * (1.0 - (t - 3.15) / 0.70) ** 2
    return 0.0


def wheel_radius():
    hub = bpy.data.objects.get("WHEEL_LF")
    if hub is None:
        return 0.36
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
            point = obj.matrix_world @ Vector(corner)
            low = min(low, point.z)
            high = max(high, point.z)
    if high <= low:
        return 0.36
    return (high - low) * 0.5


def main():
    full = "--full" in sys.argv
    check = "--check" in sys.argv
    out = Path("/workspace/assets/hero/renders/g90-arrival" if full else "/tmp/bmw-inspect/arrival")
    out.mkdir(parents=True, exist_ok=True)

    clear()
    bpy.ops.import_scene.gltf(filepath=SRC)
    paint("0.005", (0.011, 0.012, 0.014), 0.78, 0.22)
    paint("0.002", (0.008, 0.008, 0.009), 0.35, 0.38, coat=0.4)
    paint("0.003", (0.01, 0.01, 0.011), 0.05, 0.55, coat=0.0)

    low, high = bounds(list(bpy.context.scene.objects))
    center = (low + high) * 0.5
    size = high - low
    span = max(size.x, size.y)
    radius = wheel_radius()
    print(f"RADIUS {radius:.4f} CENTER {tuple(round(v, 3) for v in center)}")

    rig = bpy.data.objects.new("CarRig", None)
    bpy.context.scene.collection.objects.link(rig)
    rig.location = (0.0, 0.0, 0.36)
    bpy.context.view_layer.update()
    for obj in list(bpy.context.scene.objects):
        if obj.parent is None and obj != rig:
            world = obj.matrix_world.copy()
            obj.parent = rig
            obj.matrix_world = world
    bpy.context.view_layer.update()

    world = bpy.data.worlds.new("Studio")
    bpy.context.scene.world = world
    world.use_nodes = True
    bg = world.node_tree.nodes["Background"]
    bg.inputs[0].default_value = (0.012, 0.013, 0.016, 1)
    bg.inputs[1].default_value = 0.55

    floor_z = low.z - 0.004
    bpy.ops.mesh.primitive_plane_add(size=70, location=(0.0, 4.0, floor_z))
    floor = bpy.context.active_object
    floor.name = "Floor"
    floor_mat = bpy.data.materials.new("Floor")
    floor_mat.use_nodes = True
    floor_bsdf = floor_mat.node_tree.nodes["Principled BSDF"]
    floor_bsdf.inputs["Base Color"].default_value = (0.018, 0.019, 0.022, 1)
    floor_bsdf.inputs["Roughness"].default_value = 0.62
    floor_bsdf.inputs["Metallic"].default_value = 0.0
    floor.data.materials.append(floor_mat)

    def area(name, location, energy, color, light_size):
        light = bpy.data.lights.new(name, "AREA")
        light.energy = energy
        light.color = color
        light.size = light_size
        obj = bpy.data.objects.new(name, light)
        bpy.context.scene.collection.objects.link(obj)
        obj.location = location
        look_at(obj, Vector((0.2, 0.4, 0.7)))

    area("Key", Vector((1.4, -1.6, 5.6)), 280, (0.92, 0.94, 1.0), 9.0)
    area("Fill", Vector((-4.8, -1.0, 2.8)), 90, (0.72, 0.76, 0.86), 7.0)
    area("Rim", Vector((0.4, 5.4, 2.6)), 70, (0.78, 0.82, 0.95), 5.0)

    sun_data = bpy.data.lights.new("Sun", "SUN")
    sun_data.energy = 1.15
    sun_data.use_shadow = True
    sun_data.angle = math.radians(10)
    sun = bpy.data.objects.new("Sun", sun_data)
    bpy.context.scene.collection.objects.link(sun)
    sun.rotation_euler = (math.radians(52), 0.0, math.radians(-18))

    cam_data = bpy.data.cameras.new("Cam")
    cam_data.lens = 36
    cam = bpy.data.objects.new("Cam", cam_data)
    bpy.context.scene.collection.objects.link(cam)
    bpy.context.scene.camera = cam
    # Aim left of the car so the parked G90 sits on the right, leaving the left for the H1.
    focus = Vector((-2.4, 0.45, 0.58))
    cam.location = Vector((6.2, -4.8, 1.62))
    look_at(cam, focus)
    bpy.context.view_layer.update()
    screen_left = -(cam.matrix_world.to_3x3() @ Vector((1.0, 0.0, 0.0)))
    forward = Vector((0.0, -1.0, 0.0))
    print(
        "CAMERA",
        tuple(round(v, 3) for v in cam.location),
        "screen_left",
        tuple(round(v, 3) for v in screen_left),
        "align",
        round(forward.dot(screen_left), 3),
    )

    scene = bpy.context.scene
    scene.render.engine = "BLENDER_EEVEE"
    scene.render.resolution_x = 1280
    scene.render.resolution_y = 720
    scene.render.fps = FPS
    scene.eevee.taa_render_samples = 16 if full else 12
    scene.eevee.use_bloom = True
    scene.eevee.bloom_intensity = 0.02
    scene.eevee.use_ssr = True
    scene.view_settings.view_transform = "AgX"
    scene.view_settings.look = "AgX - Medium High Contrast"
    scene.view_settings.exposure = 0.0

    if full:
        times = [i / FPS for i in range(FPS * int(DURATION))]
    elif check:
        times = [4.0]
    else:
        times = [0.0, 1.0, 2.5, 3.05, 4.0]
    wheels = [bpy.data.objects[name] for name in WHEEL_NAMES]
    for wheel in wheels:
        # glTF empties are quaternion. Writing rotation_euler alone does not spin them.
        wheel.rotation_mode = "XYZ"

    bpy.ops.mesh.primitive_cylinder_add(radius=28, depth=16, location=(0.0, 2.0, 3.5), vertices=64)
    cove = bpy.context.active_object
    cove.name = "Cove"
    mesh = bmesh.new()
    mesh.from_mesh(cove.data)
    bmesh.ops.reverse_faces(mesh, faces=mesh.faces)
    mesh.to_mesh(cove.data)
    mesh.free()
    cove.data.materials.append(floor_mat)

    for index, t in enumerate(times):
        left = remaining(t)
        rig.location = (0.0, left, 0.36)
        rig.rotation_euler = (math.radians(pitch_deg(t)), 0.0, 0.0)
        spin = (TRAVEL - left) / radius
        for wheel in wheels:
            wheel.rotation_euler = (spin, 0.0, 0.0)
        bpy.context.view_layer.update()
        scene.render.filepath = str(out / f"frame_{index:03d}.png")
        bpy.ops.render.render(write_still=True)
        print(f"FRAME t={t:.3f} y={left:.3f} pitch={pitch_deg(t):.2f} spin={spin:.2f}")

    if not full:
        # Two close-ups, 0.45 m of forward travel, to confirm the spokes roll forward.
        cam.data.lens = 70
        for index, left in enumerate((2.0, 1.55)):
            rig.location = (0.0, left, 0.36)
            rig.rotation_euler = (0.0, 0.0, 0.0)
            spin = (TRAVEL - left) / radius
            for wheel in wheels:
                wheel.rotation_euler = (spin, 0.0, 0.0)
            bpy.context.view_layer.update()
            hub = bpy.data.objects["WHEEL_LF"].matrix_world.translation.copy()
            cam.location = hub + Vector((1.05, -0.85, 0.22))
            look_at(cam, hub)
            scene.render.filepath = str(out / f"wheel_{index}.png")
            bpy.ops.render.render(write_still=True)
            print(f"WHEEL left={left:.2f} spin={spin:.2f}")
    print("DONE", out)


if __name__ == "__main__":
    main()
