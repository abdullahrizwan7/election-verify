"""
Animates a 3D presenter character for the walkthrough video and renders it as
transparent PNG frames, which scripts/walkthrough.mjs lays over the screen recording.

Built for a static (unrigged) cartoon model: the script makes a jaw that opens with
the voice, makes the eye look around, and makes the body breathe, sway and hop.

  Blender -b --disable-autoexec MODEL.blend --python scripts/presenter.py -- \
      --timeline video/walkthrough/timeline.json --out video/walkthrough/presenter [--still 0.0,1.0]

timeline.json: { "fps": 25, "duration": seconds, "lines": [{ "at", "dur", "card" }], "loudness": [0..1 per frame] }
"""
import bpy
import bmesh
import json
import math
import os
import random
import sys
from mathutils import Vector

args = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
def arg(name, default=None):
    return args[args.index(name) + 1] if name in args else default

OUT = os.path.abspath(arg("--out", "presenter"))
STILL = arg("--still")
timeline = json.load(open(arg("--timeline"))) if arg("--timeline") else None
FPS = timeline["fps"] if timeline else 25

# ── 1. Clean up the scene and relink textures ─────────────────────────────
src = os.path.dirname(bpy.data.filepath)
files = {f.lower(): os.path.join(src, f) for f in os.listdir(src)}
for img in bpy.data.images:
    name = os.path.basename(img.filepath.replace("\\", "/")).lower()
    if name in files:
        img.filepath = files[name]
    elif "jeans" in name and "deep-blue-new-denim-jeans-texture.jpg" in files:
        img.filepath = files["deep-blue-new-denim-jeans-texture.jpg"]

CHARACTER = ["Circle", "Circle.001", "Circle.003", "Circle.004", "Circle.005", "Circle.007", "Circle.008", "Cube", "Cylinder"]
for o in list(bpy.data.objects):
    if o.type in {"LIGHT", "CAMERA"} or (o.type == "MESH" and o.name not in CHARACTER):
        if o.type == "CAMERA":
            continue
        bpy.data.objects.remove(o)
# The eye-shine shell renders as a white patch in Eevee; the glossy goggle glass is enough.
bpy.data.objects["Circle.007"].hide_render = True

# Goggle glass: clear, with a little reflection, instead of the old Cycles node mix.
glass = bpy.data.materials.get("Basic Glass")
if glass:
    nt = glass.node_tree
    nt.nodes.clear()
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    bsdf = nt.nodes.new("ShaderNodeBsdfPrincipled")
    bsdf.inputs["Base Color"].default_value = (1, 1, 1, 1)
    bsdf.inputs["Roughness"].default_value = 0.05
    bsdf.inputs["Alpha"].default_value = 0.12
    nt.links.new(bsdf.outputs[0], out.inputs[0])
    glass.surface_render_method = "BLENDED"

sc = bpy.context.scene
sc.render.engine = "BLENDER_EEVEE_NEXT"
sc.eevee.taa_render_samples = 24
sc.render.film_transparent = True
sc.render.resolution_x, sc.render.resolution_y = 560, 720
sc.render.resolution_percentage = 100
sc.render.fps = FPS
sc.view_settings.view_transform = "Standard"
sc.render.image_settings.file_format = "PNG"
sc.render.image_settings.color_mode = "RGBA"

# ── 2. A jaw: lower lip and lower teeth move down together ────────────────
MOUTH_Z = 2.02
JAW = 0.22
body = bpy.data.objects["Circle.001"]
if not body.data.shape_keys:
    body.shape_key_add(name="Basis")
jaw_key = body.shape_key_add(name="Jaw")
for i, v in enumerate(body.data.vertices):
    x, y, z = v.co.x, v.co.y, (body.matrix_world @ v.co).z
    if y < 0.3 and (body.matrix_world @ v.co).y < 0.3:
        continue
    if z < MOUTH_Z:
        d = math.sqrt((x / 0.8) ** 2 + ((z - MOUTH_Z) / 0.55) ** 2)
        w = max(0.0, 1.0 - d) ** 1.2
        jaw_key.data[i].co.z = v.co.z - JAW * w / body.matrix_world.to_scale().z
    else:
        d = math.sqrt((x / 0.8) ** 2 + ((z - MOUTH_Z) / 0.3) ** 2)
        w = max(0.0, 1.0 - d) ** 1.5
        jaw_key.data[i].co.z = v.co.z + 0.03 * w / body.matrix_world.to_scale().z

teeth = bpy.data.objects["Cube"]
low = teeth.copy()
low.data = teeth.data.copy()
low.name = "TeethLow"
sc.collection.objects.link(low)
for obj, keep_low in ((teeth, False), (low, True)):
    bm = bmesh.new()
    bm.from_mesh(obj.data)
    gone = [v for v in bm.verts if ((obj.matrix_world @ v.co).z < MOUTH_Z) != keep_low]
    bmesh.ops.delete(bm, geom=gone, context="VERTS")
    bm.to_mesh(obj.data)
    bm.free()

# ── 3. One root to move the whole character ───────────────────────────────
root = bpy.data.objects.new("Root", None)
sc.collection.objects.link(root)
def attach(child, parent):
    """Parents without moving the child."""
    bpy.context.view_layer.update()
    world = child.matrix_world.copy()
    child.parent = parent
    child.matrix_world = world

for name in CHARACTER + ["TeethLow"]:
    attach(bpy.data.objects[name], root)
eye = bpy.data.objects["Circle.005"]
eye_pivot = bpy.data.objects.new("EyePivot", None)
sc.collection.objects.link(eye_pivot)
eye_center = sum((eye.matrix_world @ Vector(c) for c in eye.bound_box), Vector()) / 8
eye_center.y -= 0.35  # rotate around the middle of the eyeball, not its surface
eye_pivot.location = eye_center
attach(eye_pivot, root)
attach(eye, eye_pivot)
bpy.context.view_layer.update()
LOW_Z = low.location.z

# ── 4. Camera and soft studio light ───────────────────────────────────────
cam = bpy.data.objects.get("Camera") or bpy.data.objects.new("Camera", bpy.data.cameras.new("Camera"))
if cam.name not in sc.collection.objects:
    sc.collection.objects.link(cam)
sc.camera = cam
cam.location = Vector((2.2, 15.5, 2.9))
cam.rotation_euler = (Vector((0.15, 0, 2.15)) - cam.location).to_track_quat("-Z", "Y").to_euler()
cam.data.lens = 82

def light(loc, energy, size):
    data = bpy.data.lights.new("Area", "AREA")
    data.energy, data.size = energy, size
    o = bpy.data.objects.new("Area", data)
    o.location = loc
    o.rotation_euler = (Vector((0, 0, 2.2)) - Vector(loc)).to_track_quat("-Z", "Y").to_euler()
    sc.collection.objects.link(o)
light((4, 9, 7), 1500, 6)
light((-6, 5, 3), 500, 6)
light((0, -6, 6), 900, 5)
world = sc.world or bpy.data.worlds.new("World")
sc.world = world
world.use_nodes = True
world.node_tree.nodes["Background"].inputs[1].default_value = 0.6

# ── 5. Animation ──────────────────────────────────────────────────────────
def pose(frame, t, loud, card_amount, hop):
    """Sets every animated value for one frame (t = seconds)."""
    jaw_key.value = loud
    low.location.z = LOW_Z - JAW * loud
    breathe = math.sin(t * 2 * math.pi / 3.2)
    root.location.z = 0.04 * breathe + 0.10 * loud + hop
    root.rotation_euler.z = math.radians(-14 + 6 * math.sin(t * 0.7) + 12 * card_amount)
    root.rotation_euler.x = math.radians(2.5 * math.sin(t * 1.1) - 2 * loud)
    root.rotation_euler.y = math.radians(3 * math.sin(t * 0.9 + 1))
    root.scale = (1 + 0.012 * breathe, 1 + 0.012 * breathe, 1 - 0.012 * breathe + 0.03 * loud)
    look_x, look_z = eye_look(t)
    eye_pivot.rotation_euler = (math.radians(look_z), 0, math.radians(look_x))
    for obj, paths in ((root, ("location", "rotation_euler", "scale")), (eye_pivot, ("rotation_euler",)), (low, ("location",))):
        for p in paths:
            obj.keyframe_insert(p, frame=frame)
    jaw_key.keyframe_insert("value", frame=frame)

random.seed(7)
glances = []
t = 0.0
while t < 600:
    t += random.uniform(1.6, 3.6)
    glances.append((t, random.uniform(-14, 8), random.uniform(-6, 6)))
def eye_look(t):
    """The eye looks mostly towards the screen (left), with quick glances, held in between."""
    current = (-8.0, 0.0)
    for start, gx, gz in glances:
        if start > t:
            break
        k = min(1.0, (t - start) / 0.12)  # a fast eye movement
        current = (current[0] + (gx - current[0]) * k, current[1] + (gz - current[1]) * k)
    return current

if STILL:
    for n, value in enumerate(float(v) for v in STILL.split(",")):
        pose(1, 0.6, value, 0, 0)
        sc.frame_set(1)
        sc.render.filepath = f"{OUT}-still{n}.png"
        bpy.ops.render.render(write_still=True)
    sys.exit(0)

loud = timeline["loudness"]
frames = len(loud)
def card_amount(t):
    for line in timeline["lines"]:
        if line["card"] and line["at"] - 0.3 <= t <= line["at"] + line["dur"] + 0.5:
            return 1.0
    return 0.0
def hop(t):
    for line in timeline["lines"]:
        if line["card"]:
            dt = t - line["at"]
            if 0 <= dt <= 0.55:
                return 0.55 * math.sin(math.pi * dt / 0.55)
    return 0.0

smooth = 0.0
for f in range(frames):
    t = f / FPS
    smooth += (min(1.0, loud[f]) - smooth) * 0.6  # a little smoothing so the jaw doesn't flicker
    pose(f + 1, t, smooth, card_amount(t), hop(t))
for action in bpy.data.actions:
    for fc in action.fcurves:
        for kp in fc.keyframe_points:
            kp.interpolation = "LINEAR"

sc.frame_start, sc.frame_end = 1, frames
os.makedirs(OUT, exist_ok=True)
sc.render.filepath = os.path.join(OUT, "f")
bpy.ops.render.render(animation=True)
