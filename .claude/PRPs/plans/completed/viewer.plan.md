# Plan: Viewer (web app with 3D muscle model)

## Summary
Create the MuscleAtlas web app: load the Draco-compressed Z-Anatomy male muscle GLB, show it with orbit
controls, and expose a small typed API (`highlight`, `focus`, `clear`, `onSelect`) that phase 4's AI tutor
will call as tools. A sidebar of the 15 seed muscles and click-to-select let a human drive it first.

## User Story
As a beginner lifter, I want to click a muscle on a 3D body and see it highlighted and framed, so that I
can see which muscle I am learning about.

## Problem → Solution
Only a throwaway spike page exists (`spike/view.html`, CDN imports, console-only highlight) → a real
Vite + TypeScript app whose viewer is a tested module with a stable API.

## Metadata
- **Complexity**: Medium (about 15 files, but half are config and assets)
- **Source PRD**: `.claude/PRPs/prds/muscleatlas.prd.md`
- **PRD Phase**: 2 - Viewer
- **Estimated Files**: 15

## Decisions this plan makes (confirm or change before implementing)
These were not settled in the PRD; I picked defaults. Each one fixes the project stack.
1. **Stack:** Vite + TypeScript + three.js, no UI framework, no lint tool yet. (Web and three.js were only
   "assumed" in the PRD.)
2. **three.js pinned to 0.170.0**, the version the spike validated. The latest on npm is 0.186.1; upgrade
   later as its own change.
3. **Commit the Draco GLB** (3.9 MB) under `public/models/` and serve the Draco decoder locally
   (`public/draco/`, about 760 KB), so the demo works offline. The GLB is a CC BY-SA 4.0 derivative, so the
   repo carries that obligation (already in `CREDITS.md`).
4. **Highlight shows both sides** (`.l` and `.r`) of a muscle. Per-side highlight is out of scope.

---

## UX Design

### Before
Throwaway page: model, orbit, highlight only via browser console.

### After
```
┌──────────────────────────────────────────────────────────┐
│ MuscleAtlas                                              │
├────────────┬─────────────────────────────────────────────┤
│ Pectoralis │                                             │
│ Deltoid    │            3D muscle figure                 │
│ Lats    ◄──│──  click a muscle or a list item            │
│ Trapezius  │  selected = red, others dimmed, camera      │
│ Biceps ... │  moves to frame it                          │
│ (15 items) │                                             │
│ [Clear]    │  Selected: Latissimus dorsi                 │
├────────────┴─────────────────────────────────────────────┤
│ Model: Z-Anatomy (CC BY-SA 4.0), BodyParts3D (CC BY-SA 2.1)│
└──────────────────────────────────────────────────────────┘
```

### Interaction Changes
| Touchpoint | Before | After | Notes |
|---|---|---|---|
| Select a muscle | Console call | List click or canvas click | Canvas click maps a mesh to a seed muscle; clicks on unmapped muscles do nothing |
| Camera | Fixed front view | Orbit + animated focus on selection | Plain lerp, no tween library |
| Credits | none | Footer with both credit lines | Required attribution |

---

## Mandatory Reading

| Priority | File | Lines | Why |
|---|---|---|---|
| P0 | `spike/FINDINGS.md` | all | Node naming, sanitising, seed mapping, materials, fixes list |
| P0 | `spike/view.html` | 25-48 | Working loader + Draco + sanitise + highlight code to port |
| P1 | `spike/check_glb.mjs` | 29-32 | Name stripping (`baseName`) and three.js sanitising rule |
| P1 | `CLAUDE.md` | all | Routing, rules, Commands section to fill |
| P2 | `CREDITS.md` | all | Attribution wording to reuse in the footer |

## External Documentation
| Topic | Source | Key Takeaway |
|---|---|---|
| Draco decoder files | jsDelivr listing of three@0.170.0, `examples/jsm/libs/draco/gltf/` | Needed files: `draco_decoder.js` (512,465 B), `draco_decoder.wasm` (192,420 B), `draco_wasm_wrapper.js` (58,456 B). `draco_encoder.js` is not needed. |
| GLB format | glTF 2.0 binary layout | 12-byte header, then the first chunk is JSON; node names can be read without decoding Draco (checked: the Draco GLB gives the same 485 mesh-node names as the plain one) |
| Vite, Vitest, TypeScript | npm | At planning time: vite 8.3.4, typescript 7.0.2, vitest 5.0.3 (from `npm view`). Not tried here; if install or typecheck fails, fall back to the previous major and note it. |

---

## Patterns to Mirror
The app repo is empty, so the only code to mirror is the spike. Port these, do not rewrite from memory.

### NODE_NAME_LOOKUP
// SOURCE: spike/view.html:39-41
```js
const sanitize = (n) => n.replace(/\s/g, "_").replace(/[[\].:/]/g, "");  // = THREE.PropertyBinding.sanitizeNodeName
const obj = gltf.scene.getObjectByName(sanitize(name));
```

### DRACO_LOADER
// SOURCE: spike/view.html:25-28
```js
const loader = new GLTFLoader();
loader.setDRACOLoader(new DRACOLoader().setDecoderPath("https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/libs/draco/gltf/"));
const gltf = await loader.loadAsync(q.get("file") || "data/muscles.glb");
```
(Change the decoder path to the local `/draco/` and the file to `/models/muscles-draco.glb`.)

### HIGHLIGHT_TRAVERSE
// SOURCE: spike/view.html:40-46
```js
obj.traverse((o) => { if (o.isMesh) o.material = red; });
```
A node with two primitives loads as a Group, so always traverse.

### BASE_NAME
// SOURCE: spike/check_glb.mjs:30
```js
const baseName = (name) => name.replace(/\.[lr]$/, "").replace(/^\((.*)\)$/, "$1");
```

### CONVENTIONS (set by this phase)
- ES modules, TypeScript strict, `camelCase` functions, kebab-case file names, tests as `src/<name>.test.ts`.
- Errors: loading failure shows a visible message in the page and `console.error`; no silent fallbacks.

---

## Files to Change

| File | Action | Responsibility |
|---|---|---|
| `package.json`, `package-lock.json` | CREATE | Scripts `dev`, `build`, `test`, `typecheck`; deps three 0.170.0, vite, typescript, vitest, @types/three |
| `tsconfig.json` | CREATE | Strict, bundler resolution, `noEmit` |
| `index.html` | CREATE | Page shell: sidebar, canvas container, footer credits |
| `src/muscle-map.ts` | CREATE | The 15 seed muscles: `{id, label, nodes: [base node names]}` from `spike/FINDINGS.md` |
| `src/muscles.ts` | CREATE | Pure helpers: `sanitize`, `nodeNamesFor(id)`, `muscleIdForNode(name)` |
| `src/viewer.ts` | CREATE | Scene, loader, materials, highlight, focus, pick, `AtlasApi` |
| `src/main.ts` | CREATE | Wires sidebar, canvas click, footer; exposes `window.atlas` |
| `src/muscles.test.ts` | CREATE | Tests for helpers and for map-vs-GLB node names |
| `public/models/muscles-draco.glb` | CREATE | Copy of `spike/data/muscles-draco.glb` |
| `public/draco/` | CREATE | The 3 decoder files from three@0.170.0 |
| `.gitignore` | UPDATE | Add `node_modules/`, `dist/` |
| `CLAUDE.md` | UPDATE | Fill "Commands" and "Layout" with the real commands |
| `CREDITS.md` | UPDATE | Add: model file in `public/models` is the derived GLB, how it was produced (`spike/export_muscles.py`) |
| `.claude/rules/viewer.md` | CREATE | Path-scoped rule (`paths: src/**`) with the node-name gotchas from FINDINGS |

## NOT Building
- AI tutor, chat UI, facts file or citations (phases 3-4).
- Per-side (left/right) highlight, muscle labels in 3D, animation of movement.
- Hiding or ghosting layers beyond the "dim others" material; no skeleton or organs.
- Deployment, hosting, analytics, accounts.
- Mesh merging or gltfpack optimisation (only if the frame-rate check in task 11 fails).
- Muscles beyond the 15 seed muscles.

---

## Step-by-Step Tasks

### Task 1: Scaffold the project
- **ACTION**: Create `package.json` (private, `"type": "module"`), install `three@0.170.0` exactly, and dev-dependencies `vite`, `typescript`, `vitest`, `@types/three@0.170.0`. Scripts: `dev` = `vite`, `build` = `vite build`, `test` = `vitest run`, `typecheck` = `tsc --noEmit`.
- **IMPLEMENT**: `tsconfig.json` with `strict`, `module: ESNext`, `moduleResolution: bundler`, `target: ES2022`, `lib: [ES2022, DOM]`, `noEmit`, `include: [src]`.
- **GOTCHA**: `spike/` has its own `package.json`; do not touch it. Keep `three` pinned without `^`.
- **VALIDATE**: `npm run typecheck` exits 0 on an empty `src/main.ts`.

### Task 2: Add assets
- **ACTION**: Copy `spike/data/muscles-draco.glb` to `public/models/muscles-draco.glb`. Download the 3 decoder files from `https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/libs/draco/gltf/` into `public/draco/`.
- **GOTCHA**: If `spike/data/` is missing (it is git-ignored), regenerate it with the Reproduce commands in `spike/FINDINGS.md`. Check the byte sizes match the Draco table above.
- **VALIDATE**: `ls -l public` shows the GLB at 3,860,020 bytes and the decoder files at 512,465 / 192,420 / 58,456 bytes.

### Task 3: Write the failing test for the helpers
- **ACTION**: In `src/muscles.test.ts` test `sanitize("Latissimus dorsi muscle.r") === "Latissimus_dorsi_muscler"`, `nodeNamesFor("biceps_brachii")` returns the 4 names `Long head of biceps brachii.l/.r`, `Short head of biceps brachii.l/.r`, and `muscleIdForNode("Short head of biceps brachii.r") === "biceps_brachii"`, plus `muscleIdForNode("Nonexistent.l") === undefined`.
- **MIRROR**: NODE_NAME_LOOKUP, BASE_NAME.
- **VALIDATE**: `npm test` fails (modules do not exist yet).

### Task 4: Implement the map and helpers
- **ACTION**: Create `src/muscle-map.ts` with the 15 seed muscles from `spike/FINDINGS.md` (ids and base node names verbatim, including the parenthesised `(Abdominal part of pectoralis major muscle)`; `label` is the TA2 English name without " muscle"). Create `src/muscles.ts` with `sanitize`, `nodeNamesFor(id)` (each base name plus `.l` and `.r`), `muscleIdForNode(name)` (strip a leading side suffix only, match against the base names; also accept sanitised input).
- **IMPLEMENT**: Keep the map a typed `const` array plus `Record` lookup; no classes.
- **GOTCHA**: Node names come back from three.js sanitised, so `muscleIdForNode` must map sanitised names back. Build a `Map<sanitisedNodeName, id>` once at module load.
- **VALIDATE**: `npm test` passes the Task 3 tests.

### Task 5: Test map against the real GLB
- **ACTION**: Add a test that reads `public/models/muscles-draco.glb` with `node:fs`, parses the GLB header, reads the first (JSON) chunk, collects `nodes[].name` that have a `mesh`, and asserts every name from `nodeNamesFor(id)` for all 15 ids is in that set, and that there are no duplicate names.
- **IMPLEMENT**: About 10 lines: `readFileSync`, `Buffer`, `readUInt32LE` for chunk length at offset 12, `JSON.parse` of bytes 20..20+length. No gltf-transform dependency.
- **GOTCHA**: Expected 485 mesh nodes in this file (checked at planning time).
- **VALIDATE**: `npm test` passes: all 58 seed node names found.

### Task 6: Viewer core
- **ACTION**: Create `src/viewer.ts` exporting `createViewer(container: HTMLElement): Promise<AtlasApi>`. Port the spike's renderer, lights, camera, OrbitControls, GLTFLoader + DRACOLoader (local paths via `import.meta.env.BASE_URL`), model centring, and front camera.
- **IMPLEMENT**: One shared `baseMaterial`, one `highlightMaterial` (red), one `dimMaterial` (same colour, `transparent: true`, `opacity: 0.15`, `depthWrite: false`). Handle resize.
- **MIRROR**: DRACO_LOADER, HIGHLIGHT_TRAVERSE.
- **GOTCHA**: Setting a new material on all 712 meshes each time is cheap; do not clone materials per mesh. Dispose nothing, since the shared materials live for the page.
- **VALIDATE**: `npm run typecheck` passes; `npm run dev` shows the figure.

### Task 7: Highlight, clear and focus
- **ACTION**: Add to the API: `highlight(ids: string[])` (unknown ids throw an `Error` naming the id, so a bad AI tool call fails loudly), `clear()` (all meshes back to base), `focus(id)` (animate controls target and camera to frame the Box3 of the muscle's nodes over about 600 ms with a plain lerp inside the animation loop).
- **IMPLEMENT**: `highlight` sets selected meshes red and all others dim; `clear` resets to base. `focus` keeps the current viewing direction and sets distance from the box size.
- **GOTCHA**: Do not bake a world transform into the Box3 of mirrored `.l` meshes; use `Box3.setFromObject` on the node objects (it applies world matrices, including the negative-scale mirror).
- **VALIDATE**: In the dev page console, `atlas.highlight(["latissimus_dorsi"])` turns both lats red and dims the rest; `atlas.focus("latissimus_dorsi")` moves the camera; `atlas.clear()` restores.

### Task 8: Picking
- **ACTION**: Add `onSelect(cb: (id: string | null) => void)`; on canvas click (ignore drags of more than 4 px), raycast against the model, walk up from the hit object to the first ancestor whose name maps via `muscleIdForNode`, and call `cb(id)` or `cb(null)` for empty space or unmapped muscles.
- **GOTCHA**: Distinguish click from orbit drag, or every drag will select. Superficial muscles are hit first; deep muscles can't be clicked until a later phase adds ghosting.
- **VALIDATE**: In the dev page, clicking the chest logs `pectoralis_major`; clicking background logs `null`.

### Task 9: UI wiring
- **ACTION**: Write `index.html` (sidebar `<ul>`, `#stage`, footer credits, error banner element) and `src/main.ts`: build the list from `muscle-map`, list click -> `highlight([id])` + `focus(id)`; canvas select -> same; Clear button -> `clear()`; show "Selected: <label>". Expose `window.atlas` for phase 4 and console testing. On load failure, show the error banner and `console.error`.
- **VALIDATE**: `npm run build` succeeds; `npm run dev` page works end to end by hand.

### Task 10: Docs and rule
- **ACTION**: Update `.gitignore` (`node_modules/`, `dist/`). Fill `CLAUDE.md` "Commands" (`npm run dev|build|test|typecheck`) and "Layout" (`src/`, `public/models`, `spike/` is throwaway research, `.claude/PRPs`). Add the GLB provenance to `CREDITS.md`. Write `.claude/rules/viewer.md` with `paths: ["src/**"]` and only true lines from FINDINGS: muscle id maps to a node list; three.js sanitises node names; nodes with two primitives are Groups; materials are placeholders set by the viewer; both CC BY-SA credit lines must stay in the footer.
- **VALIDATE**: `git diff CLAUDE.md` shows commands that actually ran in this plan.

### Task 11: Real-browser check
- **ACTION**: Run `npm run dev` and `npm run build && npx vite preview`; open in Chrome with playwright-core (installed outside the repo, in the scratchpad) in a headed window; take screenshots of: initial view, `highlight(["latissimus_dorsi"])`, `highlight(["biceps_brachii"])` after `focus`, and after a canvas click. Read each image. Measure frames per second over 3 s in the headed window, as the spike did.
- **GOTCHA**: The spike's 19-23 fps was in automated windows. If the headed result is under 30 fps, record it and decide on mesh merging in a follow-up; do not fix it in this phase unless it is unusable.
- **VALIDATE**: Screenshots read; fps and load time written into the implementation report. Ask the owner to hand-check the page once (screenshots are not the hand check).

---

## Testing Strategy

### Unit Tests
| Test | Input | Expected Output | Edge Case? |
|---|---|---|---|
| sanitise | `Latissimus dorsi muscle.r` | `Latissimus_dorsi_muscler` | Yes |
| nodeNamesFor | `biceps_brachii` | 4 names with `.l`/`.r` | |
| nodeNamesFor | `pectoralis_major` | includes `(Abdominal part of pectoralis major muscle).l` | Yes: parentheses |
| muscleIdForNode | sanitised and raw names | the same id | Yes |
| muscleIdForNode | unknown | `undefined` | Yes |
| map vs GLB | all 15 ids | all 58 names present, 485 mesh nodes, no duplicates | |

Viewer behaviour (highlight, focus, picking) is checked in the real browser in task 11; no WebGL unit tests.

### Edge Cases Checklist
- [ ] Unknown muscle id passed to `highlight` throws a clear error
- [ ] `clear()` with nothing selected
- [ ] Orbit drag does not select
- [ ] Click on empty space and on an unmapped muscle returns null
- [ ] GLB or decoder fails to load: visible error, no blank page
- [ ] Window resize keeps aspect ratio
- [ ] Tab hidden/visible does not break the animation loop

## Validation Commands

```bash
npm run typecheck   # EXPECT: zero errors
npm test            # EXPECT: all tests pass (report the count)
npm run build       # EXPECT: build succeeds; dist/ contains models/ and draco/
```
No lint tool is installed (decision 1); add one in a later phase if wanted.

### Manual Validation
- [ ] Figure renders; orbit and zoom work
- [ ] Each of the 15 list items highlights, dims others and frames the camera
- [ ] Canvas click selects a seed muscle
- [ ] Footer shows both credit lines
- [ ] Load time and fps from a real window recorded

## Acceptance Criteria
- [ ] All tasks completed
- [ ] typecheck, tests and build pass, counts reported
- [ ] `AtlasApi` (`highlight`, `clear`, `focus`, `onSelect`) works from `window.atlas`
- [ ] Screenshots read and confirmed
- [ ] No new dependency beyond three, vite, typescript, vitest, @types/three

## Completion Checklist
- [ ] Spike code ported, not reinvented
- [ ] No hardcoded paths outside `public/`
- [ ] Credits visible in the page and in `CREDITS.md`
- [ ] No scope beyond phase 2
- [ ] Nothing committed without the owner asking

## Risks
| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Frame rate under 30 fps (712 meshes) | M | M | Measure in task 11; follow-up: merge tendon primitives or gltfpack |
| Newest Vite/TypeScript/Vitest majors misbehave | L | L | Fall back one major, note it |
| Deep muscles can't be clicked (hidden under superficial ones) | H | L | Known; list selection works for all 15; ghosting is a later phase |
| Dimmed transparent materials sort badly | M | L | `depthWrite: false`; if ugly, dim by colour instead of opacity |
| Committing a 3.9 MB CC BY-SA model | L | L | Intended; credit lines stay in the footer |

## Notes
- Verified now: the Draco GLB has 485 mesh-node names, identical to the plain GLB (read from the JSON chunk, Python); the decoder file names and sizes come from the jsDelivr listing for three@0.170.0; the spike code to port is in `spike/view.html`.
- Not verified: Vite 8 / TypeScript 7 / Vitest 5 working together (versions from `npm view` only), real-window frame rate.
- Routing: Sonnet agent for tasks 1-10 (well specified). Task 11 needs a browser and screenshot reading, so the main session or a Fable review should look at the images. Phase 3 (facts file) touches different files (`data/`), so it can run in parallel.
