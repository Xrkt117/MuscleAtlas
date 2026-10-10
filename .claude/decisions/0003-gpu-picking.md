# 0003 — Muscle picking is a 1-pixel GPU id render, not raycasting or a BVH

**Date:** 2026-10-09
**Status:** accepted (rationale partly superseded by 0006)

## Context
The viewer has about 700 heavy muscle meshes (about 1M vertices) and picks on every hover. Raycasting stalled
frames: first-hover worst frame 337-581 ms in a real Chrome window on an Apple M5.

## Decision
`pick()` renders the muscle scene into a 1x1 target through `camera.setViewOffset`, each mesh drawn flat with a
colour that encodes its muscle id; unmapped muscles draw black so they still occlude; the skeleton is hidden for
the pass. Hover is throttled to 50 ms and paused during focus animations. A short warm-up at load removes the
cold-start stall (first-hover worst frame about 90-130 ms).

## Consequences
- About 9 of 500 grid points differed from raycasting (silhouette edges and the left/right seam).
- Later sweeps are about as fast as raycasting; the gain is mainly the first hover.
- Warm-up work at load adds time.

## Alternatives rejected
- **three-mesh-bvh:** a new dependency plus BVH build time for 700 meshes at load.
- **Raycast on simplified proxy meshes:** needs extra assets and keeps two geometries in sync.
- **Keep raycasting with a throttle:** a single hit still cost hundreds of ms.
