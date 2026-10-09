# Run inside Blender: Blender --background --disable-autoexec <blend> --python spike/inspect_blend.py -- <out.txt>
# Prints the collection tree with object counts, then every mesh object under muscle collections.
import sys
import bpy

out_path = sys.argv[sys.argv.index("--") + 1] if "--" in sys.argv else "inspect.txt"
lines = []


def tree(coll, depth=0):
    meshes = [o for o in coll.objects if o.type == "MESH"]
    lines.append(f"{'  ' * depth}{coll.name}  objects={len(coll.objects)} meshes={len(meshes)} all_objects={len(coll.all_objects)}")
    for child in coll.children:
        tree(child, depth + 1)


lines.append("== Collection tree ==")
tree(bpy.context.scene.collection)

lines.append("== Object types ==")
types = {}
for o in bpy.data.objects:
    types[o.type] = types.get(o.type, 0) + 1
lines.append(str(types))

# The muscle layer is the top-level collection "4: Muscular system" (found by the first run of this script).
root = next(c for c in bpy.context.scene.collection.children if "Muscular system" in c.name)
lines.append(f"== Objects in {root.name} ==")
lines.append("name\ttype\tverts\tparent\tmods\thide_viewport\thide_render\tmesh_users\tcollection")
mesh_count = total_verts = 0
for o in sorted(root.all_objects, key=lambda o: o.name):
    verts = len(o.data.vertices) if o.type == "MESH" else 0
    if o.type == "MESH":
        mesh_count += 1
        total_verts += verts
    mods = ",".join(m.type for m in o.modifiers) or "-"
    users = o.data.users if o.data else 0
    lines.append(f"{o.name}\t{o.type}\t{verts}\t{o.parent.name if o.parent else '-'}\t{mods}"
                 f"\t{o.hide_viewport or o.hide_get()}\t{o.hide_render}\t{users}\t{o.users_collection[0].name}")
lines.append(f"== {root.name}: {len(root.all_objects)} objects, {mesh_count} meshes, {total_verts} verts (pre-modifier) ==")

with open(out_path, "w") as f:
    f.write("\n".join(lines) + "\n")
print(f"wrote {out_path}: {mesh_count} muscle meshes, {total_verts} verts")
