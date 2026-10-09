# Plan: Skeleton under the muscles (viewer addition)

## Summary
Show the Z-Anatomy skeleton beneath the muscle model. Only muscles stay selectable: the skeleton is a
separate GLB, loaded into its own scene group, and never part of the raycast target or of highlight/dim.

## Why a separate, joined mesh
Bones need no individual ids, so they can be merged into a few meshes (few draw calls). The muscle layer
already costs 712 draw calls at about 50 fps (measured in a real window), and "1: Skeletal system" has
1,244 meshes, so unmerged bones would likely hurt frame rate.

## Metadata
- **Complexity**: Medium-small. Part A (asset, unknowns): Opus. Part B (viewer, specified): Sonnet.
- **PRD**: enhancement to phase 2 (Viewer). Source collection: `1: Skeletal system` in `Startup.blend`.

## Part A - export the skeleton (`spike/export_skeleton.py`, `public/models/skeleton-draco.glb`)
1. Inspect `1: Skeletal system` first: object counts by type, which objects are `.g` labels or `.j` leader
   lines (skip them as in `spike/export_muscles.py`), obvious non-bone clutter (teeth, cartilage, ligaments,
   sesamoids), vertex totals. Record the numbers.
2. Export all remaining bone meshes with the same options as `export_muscles.py`, then join into as few
   meshes as is practical (one mesh, or a few, for example one per region).
3. GOTCHAS: left/right bones share meshes and are mirrored by a negative-scale parent transform, so a join
   can flip winding or normals on one side. Check visually. If a join is wrong, merge differently (apply
   transforms and recalculate normals before the join) or export unjoined and measure the cost instead.
   `export_materials="EXPORT"` crashes on this file; use `PLACEHOLDER`.
4. MEASURE and report: object counts (before/after join), vertices, GLB size plain and Draco, export time.
   Budget: Draco skeleton at most 6 MB. If it is bigger, drop tiny parts (teeth, hand/foot bones are NOT to
   be dropped silently) and say what was dropped.
5. Verify with `node spike/check_glb.mjs`-style checks: file loads, mesh and vertex counts, no node whose
   name equals a muscle node name. Verify visually in the browser (screenshot read): left and right sides
   both look correct, shading not inverted.

## Part B - viewer (`src/viewer.ts`, `src/main.ts` only if needed, tests, docs)
- Load `skeleton-draco.glb` after the muscle model with the same Draco loader; put it in its own `Group`
  added to the scene before the muscles. Give it one shared opaque bone material (ivory, e.g. `0xe8e0cc`,
  roughness about 0.8); never include its meshes in `meshes[]`, `highlight`, `clear` or picking.
- `raycaster.intersectObject(gltf.scene, true)` stays muscle-only (this is what keeps bones unselectable).
  Add a code comment saying so.
- Camera framing keeps using the muscle model's box.
- A skeleton load failure shows the existing error banner and `console.error`.
- Tests: GLB file exists; its JSON-chunk node names contain no muscle node name; `muscleIdForNode` returns
  undefined for every skeleton node name.
- Docs: `CREDITS.md` provenance for the skeleton GLB (same Z-Anatomy/BodyParts3D CC BY-SA obligations),
  `CLAUDE.md` Layout line, `.claude/rules/viewer.md` one line: "skeleton is decoration, not selectable".

## Validation
`npm run typecheck`, `npm test`, `npm run build` with counts. Browser (screenshots read, real headed window
for fps): initial view; a muscle highlighted with others dimmed (skeleton visible through the ghosted
muscles); a click on a muscle selects it; a click on a bone-only area selects nothing. FPS target at least
30 in a headed window; report the number and the load time.

## NOT Building
Skeleton toggle or opacity controls, selectable bones, other layers (joints, organs, vessels), per-bone
labels.

## Risks
| Risk | Mitigation |
|---|---|
| Mirrored bones render wrong after the join | Visual check of both sides; alternative merge or unjoined export |
| Page weight/FPS | Budget 6 MB Draco; measure FPS in a headed window |
| Bones are hidden under opaque muscles in the default view | Expected: visible through ghosted muscles and at gaps (skull, hands, feet). Report honestly |
