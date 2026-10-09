# Run inside Blender (4.2):
#   Blender --background --disable-autoexec <Startup.blend> --python spike/export_muscles.py -- <out.glb> [draco]
# Exports the muscle meshes of "4: Muscular system" to GLB.
# Skipped: ".g" label/group objects, ".j" label leader lines, and fasciae, bursae and tendon sheaths
# (non-muscle, and fasciae sit on top of the muscles).
import re
import sys
import bpy

args = sys.argv[sys.argv.index("--") + 1:]
out_path = args[0]
draco = "draco" in args[1:]

SKIP = re.compile(r"fasci|bursa|sheath", re.I)


def skipped(o):
    if o.type != "MESH" or o.name.endswith((".g", ".j")):
        return True
    p = o
    while p:
        if SKIP.search(p.name):
            return True
        p = p.parent
    return False


root = next(c for c in bpy.context.scene.collection.children if "Muscular system" in c.name)
muscles = [o for o in root.all_objects if not skipped(o)]

# Hidden objects cannot be selected; un-hide everything we export.
for o in muscles:
    o.hide_set(False)
    o.hide_viewport = False
bpy.ops.object.select_all(action="DESELECT")
for o in muscles:
    o.select_set(True)
bpy.context.view_layer.objects.active = muscles[0]

bpy.ops.export_scene.gltf(
    filepath=out_path,
    export_format="GLB",
    use_selection=True,
    use_visible=False,
    use_renderable=False,  # most muscles have hide_render=True in this file
    export_apply=True,  # apply modifiers (SUBSURF/SOLIDIFY on a few objects)
    export_yup=True,
    # "EXPORT" crashes in 4.2.2 (IndexError in gltf2_blender_search_node_tree.py on Z-Anatomy's
    # node-group materials). PLACEHOLDER keeps the per-material primitive split (muscle vs tendon).
    export_materials="PLACEHOLDER",
    export_animations=False,
    export_cameras=False,
    export_lights=False,
    export_extras=False,
    export_draco_mesh_compression_enable=draco,
)
print(f"EXPORTED {len(muscles)} objects -> {out_path} (draco={draco})")
