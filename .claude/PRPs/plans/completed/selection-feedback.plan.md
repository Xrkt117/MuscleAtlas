# Plan: Selection feedback (hover) and camera that faces the muscle

## Summary
Make selecting a muscle feel responsive: hovering previews the muscle and shows its name; selecting turns
the camera to the side of the body where the muscle is visible; clicking on nothing (or Esc) deselects.

## What exists (read from the repo)
- `src/viewer.ts`: `highlight(ids)` sets selected meshes red and all others dim; `clear()` resets;
  `focus(id)` frames the muscle but keeps the current viewing direction; `onSelect(cb)` on a click with
  at most 4 px of drag. Three shared materials: base, highlight (red), dim (opacity 0.15).
- `src/main.ts`: one `select(id|null)` updates highlight, focus, the "Selected:" label and the sidebar
  `aria-pressed` buttons. Sidebar and canvas selection are already in sync. A canvas click on empty space
  or an unmapped muscle is ignored on purpose (`if (id !== null) select(id)`).
- No hover, no tooltip. Back muscles (lats, glutes, hamstrings, calves, triceps, trapezius) are seen from
  the front through the ghosted body.

## Decisions (change before implementing if you disagree)
1. Hover colour is a warm yellow (`0xffc857`), opaque. Selected stays red. Hovering never dims the rest.
2. A click on nothing deselects (this reverses the current "ignore" behaviour). So does Esc. A click on an
   unmapped muscle also deselects, because the viewer reports both as `null`.
3. Camera faces the muscle only if you are on the wrong side. If you are already looking from the muscle's
   side (within 90 degrees of it), the azimuth stays where you put it.
4. The side comes from one new field per seed muscle, `view: "front" | "back"`, hand-assigned (below). The
   deltoid and serratus anterior are "front" because they are visible from the front; ask if you want a
   side view added later.

| front | back |
|---|---|
| pectoralis_major, deltoid, serratus_anterior, biceps_brachii, rectus_abdominis, quadriceps_femoris | latissimus_dorsi, trapezius, triceps_brachii, gluteus_maximus, biceps_femoris, semitendinosus, semimembranosus, gastrocnemius, soleus |

## Files
| File | Action | What |
|---|---|---|
| `src/muscle-map.ts` | UPDATE | Add `view` to the `Muscle` interface and the 15 rows |
| `src/camera.ts` | CREATE | Pure `targetAzimuth(currentAz, view)` (no three.js types) |
| `src/camera.test.ts` | CREATE | Tests, written first (see below) |
| `src/viewer.ts` | UPDATE | Hover state and material, `onHover`, azimuth-aware `focus`, state refresh |
| `src/main.ts` | UPDATE | Tooltip wiring, deselect on `null`, Esc key |
| `index.html` | UPDATE | `#tip` element and pointer cursor style |
| `.claude/rules/viewer.md` | UPDATE | One line: `view` field and what it drives |

## Design
- `AtlasApi` gains `onHover(cb: (id: string | null, clientX: number, clientY: number) => void): () => void`.
- Keep selection and hover as two variables and recompute all materials in one `refresh()`:
  selected muscle meshes red; if anything is selected, every other mesh dim; the hovered muscle (when not
  selected) gets the hover material; otherwise base. `highlight`, `clear`, and hover all call `refresh()`.
- Hover: on `pointermove`, ignore while a button is pressed (orbiting) and while a focus animation runs.
  Raycast at most once per animation frame (flag set in the event, work done in the frame). Reuse the
  existing ancestor walk and `muscleIdForNode`. Set `renderer.domElement.style.cursor` to `pointer` over a
  muscle, otherwise empty. On `pointerleave`, hover goes to `null`.
- `camera.ts`: azimuth is `Math.atan2(x, z)` of the camera offset from the controls target in the horizontal
  plane. `targetAzimuth(current, view)` returns `current` if `cos(current - wanted) > 0` (wanted is 0 for
  front, pi for back), otherwise `current + shortestDelta(current -> wanted)`, so the animation turns the
  short way round and never lerps straight through the body.
- `focus(id)`: animate azimuth (not the position vector) plus distance, elevation (keep the current
  elevation) and target, all with the existing 600 ms lerp. Compute the camera position each frame from
  azimuth, elevation and distance, so the camera stays on a circle around the muscle and never passes
  through the figure.
- Tooltip: `main.ts` positions `#tip` (inside `#stage`, `pointer-events: none`) 12 px right of and below
  the cursor, clamped to the stage, text from `MUSCLE_BY_ID[id].label`; hidden on `null`.

## Tasks (TDD where it is pure)
1. `src/camera.test.ts` first: `targetAzimuth(0.2, "front") === 0.2`; `targetAzimuth(0.2, "back")` equals
   `0.2 + shortest delta to pi`, i.e. about `pi` after normalising, going the positive way; `targetAzimuth(-0.2,
   "back")` goes the negative way (to `-pi`); `targetAzimuth(3, "back") === 3` (already behind); wrap-around
   `targetAzimuth(2 * Math.PI + 0.1, "front")` keeps `2*pi + 0.1`. Run and see it fail.
2. Add `src/camera.ts`; tests pass.
3. Add `view` to `src/muscle-map.ts` with the table above. Add a test that every muscle has a `view`
   (extend `src/muscles.test.ts`).
4. Refactor `viewer.ts` to the `refresh()` state model with no behaviour change. Run the tests; click and
   highlight must work as before.
5. Add hover and `onHover`; cursor style.
6. Make `focus` azimuth-aware.
7. `main.ts` and `index.html`: tooltip, deselect on `null`, Esc.
8. Docs: rule line in `.claude/rules/viewer.md`.

## Validation
`npm run typecheck`, `npm test`, `npm run build` with counts. Then in a real headed Chrome window, with
screenshots read:
- hover over the chest: yellow chest and a "Pectoralis major" tooltip near the cursor; moving away clears;
- select Latissimus dorsi while facing the front: the camera turns to the back, the lats are in view and
  the shortest way round; select Biceps brachii afterwards and the camera turns back to the front;
- select Biceps brachii while already looking from the front-right: azimuth unchanged;
- click on empty space and press Esc: selection clears, sidebar buttons reset;
- an orbit drag does not change hover or selection;
- measure the time of the hover raycast per frame (`performance.now()` around it) over 100 moves and report
  the median and worst case. If the worst case exceeds 8 ms, throttle to every 50 ms and say so. Do not add a
  dependency (for example three-mesh-bvh) without asking.

## NOT Building
Picking a single head or one side, click-to-cycle through overlapping muscles, hiding the covering muscles,
a touch-screen hover substitute, a muscle info panel.

## Risks
| Risk | Mitigation |
|---|---|
| Raycasting about 700 heavy meshes on every move is slow | One raycast per frame, measure, throttle if the worst case is over 8 ms |
| Hover and selection materials fight | One `refresh()` is the only place materials are assigned |
| Camera passes through the body on a 180-degree turn | Animate azimuth on a circle, not the position vector |
| Deselect on empty click annoys users | It is decision 2; revert the one line in `main.ts` |
