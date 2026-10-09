# Run inside Blender (4.2):
#   Blender --background --disable-autoexec <Startup.blend> --python spike/export_skeleton.py -- <out.glb> [draco]
# Exports the bones of "1: Skeletal system" as ONE joined mesh named "Skeleton" (decoration, not selectable).
# Skipped: ".g" labels (incl. the "Skeletal system.g" mesh), ".j"/".i" label leader lines, and boolean cutter
# objects (the six "... cells of ethmoid bone" meshes, hidden, subtracted from "Ethmoid bone").
# Kept: all bones incl. hand/foot bones, teeth, ear ossicles, costal/laryngeal/nasal cartilage.
import sys
import time
import bpy

args = sys.argv[sys.argv.index("--") + 1:]
out_path = args[0]
draco = "draco" in args[1:]
t0 = time.time()

root = next(c for c in bpy.context.scene.collection.children if "Skeletal system" in c.name)
cutters = {m.object for o in root.all_objects for m in o.modifiers if m.type == "BOOLEAN" and m.object}
bones = [o for o in root.all_objects
         if o.type == "MESH" and not o.name.endswith((".g", ".j", ".i")) and o not in cutters]

# Bake each bone (modifiers applied, world transform applied) into a new object, then join.
# Left bones share a mesh with the right and are mirrored by a negative-scale parent: applying that
# matrix turns faces inside out, so flip them back.
dg = bpy.context.evaluated_depsgraph_get()
src_verts = sum(len(o.data.vertices) for o in bones)
baked = []
for o in bones:
    me = bpy.data.meshes.new_from_object(o.evaluated_get(dg))
    me.transform(o.matrix_world)
    if o.matrix_world.determinant() < 0:
        me.flip_normals()
    me.materials.clear()
    ob = bpy.data.objects.new(o.name, me)
    bpy.context.scene.collection.objects.link(ob)
    baked.append(ob)

bpy.ops.object.select_all(action="DESELECT")
for ob in baked:
    ob.select_set(True)
bpy.context.view_layer.objects.active = baked[0]
bpy.ops.object.join()
skel = bpy.context.view_layer.objects.active
skel.name = skel.data.name = "Skeleton"
# 15 source meshes carry custom normals, which flip_normals does not handle; use computed normals.
bpy.ops.mesh.customdata_custom_splitnormals_clear()
n_verts = len(skel.data.vertices)

bpy.ops.object.select_all(action="DESELECT")
skel.select_set(True)
bpy.ops.export_scene.gltf(
    filepath=out_path,
    export_format="GLB",
    use_selection=True,
    use_visible=False,
    use_renderable=False,
    export_apply=False,  # already applied above
    export_yup=True,
    export_materials="PLACEHOLDER",  # "EXPORT" crashes in 4.2.2 on this file (see export_muscles.py)
    export_texcoords=False,  # the viewer uses one plain bone material; UVs are dead weight
    export_animations=False,
    export_cameras=False,
    export_lights=False,
    export_extras=False,
    export_draco_mesh_compression_enable=draco,
)
print(f"EXPORTED {len(bones)} bone objects ({src_verts} source verts) -> 1 mesh, {n_verts} verts, "
      f"{len(skel.data.polygons)} faces -> {out_path} (draco={draco}) in {time.time() - t0:.1f}s")
