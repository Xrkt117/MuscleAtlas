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
