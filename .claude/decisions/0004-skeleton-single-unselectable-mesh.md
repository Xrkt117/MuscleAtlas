# 0004 — Skeleton is one joined, unselectable mesh in its own group

**Date:** 2026-10-09
**Status:** accepted

## Context
The owner wanted the skeleton under the muscles for looks, with only muscles selectable. The source collection
"1: Skeletal system" has 1,244 meshes; the muscle layer already costs 712 draw calls at about 50 fps.

## Decision
Export the 271 bone meshes as one joined mesh (Draco GLB, 1.6 MB), load it into its own scene group with one bone
material, and never include it in picking, highlight or dim. A test checks no skeleton node name maps to a muscle.

## Consequences
- Bones cannot be individually addressed or labelled.
- FPS drops from about 50 to about 41 in a headed window.
- Bones show only through gaps and through ghosted muscles, not in the default all-opaque view.

## Alternatives rejected
- **Unjoined bones (about 270 nodes):** more draw calls and no use for per-bone ids.
- **Selectable bones:** not wanted, and would widen the picking scope.
