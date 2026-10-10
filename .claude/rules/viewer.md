---
paths:
  - "src/**"
---
# Viewer rules (from spike/FINDINGS.md)
- A muscle id maps to a list of GLB nodes, not one node (biceps = long head + short head). Each node exists as `<name>.l` and `<name>.r`.
- GLTFLoader sanitises node names (whitespace to `_`, strips `[ ] . : /`): `Latissimus dorsi muscle.r` becomes `Latissimus_dorsi_muscler`. Look nodes up with `getObjectByName(sanitize(name))`.
- A node with two primitives loads as a Group, so material changes must traverse it.
- Materials in the GLB are placeholders (`export_materials="PLACEHOLDER"`); the viewer assigns its own.
- Some node names are wrapped in parentheses, e.g. `(Abdominal part of pectoralis major muscle).l`; the parentheses are part of the name.
- The GLB is a CC BY-SA 4.0 derivative: both credit lines (Z-Anatomy CC-BY-SA 4.0, BodyParts3D CC-BY-SA 2.1 Japan) must stay in the page footer.
- The skeleton (`skeleton-draco.glb`) is decoration loaded into its own group: it is never raycast, highlighted or dimmed.
- `Muscle.view` ("front" | "back", hand-assigned) picks the side `focus()` turns the camera to (`targetAzimuth` in `camera.ts`); the camera animates azimuth/elevation/distance/target, never the position vector. Materials are assigned only in `refresh()` (selected, hover, dim, base).
- Picking is GPU-based (`pick()`: 1x1 render target, flat id colours, skeleton hidden for the pass). The stalls that motivated it were measured in Rosetta-emulated Chrome; native Chrome handles the old raycast fine (see ADR 0006), so re-measure natively before changing pick() either way. `AtlasApi.preview(id|null)` is the sidebar hover preview: it yields to the pointer while it is on the canvas.
- `onFrame` hands out ONE reused `FrameInfo` (valid only inside the callback) built from cached surface anchors (`anchorForObject`, one limb side per muscle, 0.85 hysteresis); anchors for all 15 muscles are computed once at load, behind the loading overlay (about 15 ms in native Chrome). No raycasts or layout reads in that hook.
- `callouts.ts` never reads layout per frame: label sizes and avoid rects are cached (ResizeObserver) and DOM writes happen only when the rounded value changes; positions are never CSS-transitioned.
- List rail: card open on load, collapses to a `Muscles` pill after the first selection; pill click/focus or `M` opens it as an overlay; Esc with it open only closes it. Pill and card count as callout avoid rects only while visible.
