# Plan: Model spike (Z-Anatomy male muscles to web glTF)

## Summary
Prove that the Z-Anatomy male muscle layer can be exported from Blender to a glTF/GLB that loads in a
browser with identifiable, individually addressable muscle meshes. Produce the first draft of the
muscle-id to mesh-name mapping that phases 2-4 depend on.

## User Story
As the MuscleAtlas builder, I want a web-ready male muscle model with stable mesh names, so that the
viewer and the AI tutor can highlight any muscle by id.

## Problem → Solution
Z-Anatomy ships as a Blender template; nobody has checked it exports usable → a measured GLB, a name
list, a size, and a go/no-go decision.

## Metadata
- **Complexity**: Small (about 5 new files, mostly throwaway spike code)
- **Source PRD**: `.claude/PRPs/prds/muscleatlas.prd.md`
- **PRD Phase**: 1 - Model spike
- **Estimated Files**: 6

---

## UX Design
Internal change — no user-facing UX transformation.

---

## Mandatory Reading

The repo is empty (only the setup files), so there are no codebase patterns to mirror.

| Priority | File | Lines | Why |
|---|---|---|---|
| P0 | `CLAUDE.md` | all | Working rules, routing, commit rules |
| P0 | `.claude/PRPs/prds/muscleatlas.prd.md` | Technical Approach, Phase 1 | Success signal and risks |
| P1 | Z-Anatomy `License.txt`, `Readme.md` (downloaded in task 1) | all | Attribution wording |

## External Documentation

| Topic | Source | Key Takeaway |
|---|---|---|
| Z-Anatomy contents | https://github.com/Z-Anatomy/Models-of-human-anatomy (default branch `master`) | Contains `Z-Anatomy.zip` (86,734,957 bytes, checked via GitHub API), `TA2.csv`, `Z-Biomechanics.7z`. Readme describes a male model only. |
| Licence | Same repo, Readme | CC BY-SA 4.0; credit lines: "BodyParts3D - The Database Center for Life Science - CC-BY-SA 2.1 Japan" and "Z-Anatomy - The libre 3D atlas of anatomy - CC-BY-SA 4.0". Derivative works must be shared under the same licence. |
| Name vocabulary | `TA2.csv` | Semicolon-separated inside quoted lines, header `TA2ID;English;Latin;...`. 7,314 lines; 422 mention "muscle" (checked with grep). |
| Blender glTF export | Blender manual, glTF 2.0 page | NOT read: the manual URL I tried returned 404. Read the installed Blender's export operator options (`bpy.ops.export_scene.gltf.get_rna_type()`) in task 4 instead of relying on memory. |

---

## Patterns to Mirror
None: empty repo. This spike sets the conventions. Keep to these:
- Spike code lives in `spike/`, large downloads in `spike/data/` (git-ignored).
- Python run with `-I` for anything touching downloaded files; Blender scripts run via
  `/Applications/Blender.app/Contents/MacOS/Blender --background <file> --python <script>`.

---

## Files to Change

| File | Action | Justification |
|---|---|---|
| `.gitignore` | UPDATE | Ignore `spike/data/` (87 MB zip, extracted .blend) |
| `spike/inspect_blend.py` | CREATE | Blender script: list collections, objects, mesh counts, names |
| `spike/export_muscles.py` | CREATE | Blender script: export the muscle objects to GLB |
| `spike/check_glb.mjs` | CREATE | Node script: read GLB, list node names, check against `TA2.csv` |
| `spike/FINDINGS.md` | CREATE | Measured results, go/no-go, open issues |
| `CREDITS.md` | CREATE | Attribution required by CC BY-SA |
| `.claude/PRPs/prds/muscleatlas.prd.md` | UPDATE | Phase 1 status and plan link |

## NOT Building
- The viewer (phase 2), facts file (phase 3), AI tutor (phase 4).
- Female anatomy, skeleton/organ layers, animation or rigging.
- A finished id-to-name mapping for every muscle; only a seed for the major muscles.
- Mesh optimisation beyond what is needed to measure size.

---

## Step-by-Step Tasks

### Task 1: Ignore spike data
- **ACTION**: Add `spike/data/` to `.gitignore`.
- **VALIDATE**: `git check-ignore spike/data/x` prints the path.

### Task 2: Download and unpack Z-Anatomy
- **ACTION**: Download `Z-Anatomy.zip` from the repo's `master` branch (raw/LFS link; check it is the 86.7 MB file, not an LFS pointer) into `spike/data/zanatomy/` (its own new directory). Unzip there. Save `TA2.csv`, `License.txt`, `Readme.md` alongside.
- **GOTCHA**: Downloaded files are untrusted: do not run anything from inside that directory, and pass paths as arguments. A small file instead of ~87 MB means an LFS pointer.
- **VALIDATE**: `ls -la spike/data/zanatomy` shows a `.blend` file; size of the zip is 86,734,957 bytes.

### Task 3: Inspect the .blend structure
- **ACTION**: Write `spike/inspect_blend.py` (runs inside Blender): print top-level collections, object count per collection, and for the muscle collection(s) each object's name, type, vertex count, and parent. Write the output to `spike/data/inspect.txt`.
- **GOTCHA**: The collection layout is unknown until this runs. Do not assume muscles sit in one collection or that names are TA2 English names; left/right may be suffixes (`.l`/`.r`). 
- **VALIDATE**: Output lists at least 100 muscle objects. Record total vertex count.

### Task 4: Export muscles to GLB
- **ACTION**: Write `spike/export_muscles.py`: select only the muscle objects found in task 3, export GLB with applied modifiers and object names preserved. First read the export operator's actual option names from the installed Blender (4.2.2), then pick options; try without Draco first, then with.
- **GOTCHA**: If several objects share a name, Blender appends `.001`; duplicates would break id mapping. Hidden objects may be skipped by "visible only" settings.
- **VALIDATE**: `spike/data/muscles.glb` exists; record size with and without Draco.

### Task 5: Check names in Node
- **ACTION**: Write `spike/check_glb.mjs` using `@gltf-transform/core` (dev dependency in `spike/`): read the GLB, count nodes/meshes, list names, flag duplicates and names not found in `TA2.csv` English or Latin columns.
- **VALIDATE**: Prints node count, duplicate count, unmatched count. Targets: 0 duplicates; unmatched count recorded (no target yet).

### Task 6: Load in a browser
- **ACTION**: Minimal throwaway three.js page in `spike/` that loads the GLB, shows it with orbit controls, and turns one named mesh red from the console.
- **VALIDATE**: Open it locally and take a screenshot; read the image to confirm the muscles render and one highlights. Record load time and FPS roughly.

### Task 7: Seed mapping
- **ACTION**: In `FINDINGS.md`, add a table of about 15 major muscles (e.g. pectoralis major, deltoid, latissimus dorsi, biceps brachii, triceps brachii, rectus abdominis, quadriceps, hamstrings, gluteus maximus, gastrocnemius) with node names and TA2 English name. Left/right handling noted.
- **VALIDATE**: Every row resolves to a real node name from task 5.

### Task 8: Credits
- **ACTION**: Write `CREDITS.md` with the two credit lines above, the licence, and that derived models must be shared under CC BY-SA 4.0.
- **VALIDATE**: Wording matches the Readme.

### Task 9: Findings and go/no-go
- **ACTION**: Write `spike/FINDINGS.md`: structure found, GLB size, duplicates, unmatched names, render check, and a decision: go, go with fixes, or switch model. Update the PRD phase 1 row to `complete` (or note blockers) and open questions answered.
- **VALIDATE**: A reader can start phase 2 from FINDINGS.md alone.

---

## Testing Strategy
Spike, so no test suite. The runnable check is `spike/check_glb.mjs`, which fails (non-zero exit) on an empty GLB or duplicate node names.

| Check | Expected |
|---|---|
| Node count | >100 muscle nodes |
| Duplicate names | 0 |
| Seed muscles found | 15 of 15 |
| Browser render | Model visible, one mesh highlights |

### Edge Cases Checklist
- [ ] Left and right muscles named distinctly
- [ ] Names with `.001` suffixes
- [ ] Muscles split into sub-parts (e.g. heads of a muscle)
- [ ] LFS pointer instead of the real zip
- [ ] GLB too big for a hackathon demo (decide threshold; TBD)

## Validation Commands

```bash
# Inspect and export (paths as arguments, no cd into download dir)
/Applications/Blender.app/Contents/MacOS/Blender --background <blend> --python spike/inspect_blend.py
/Applications/Blender.app/Contents/MacOS/Blender --background <blend> --python spike/export_muscles.py
node spike/check_glb.mjs spike/data/muscles.glb spike/data/zanatomy/TA2.csv
```
EXPECT: exit code 0; duplicates 0.

Static analysis, unit tests, database and full suite: not applicable. Build and lint commands are undecided (CLAUDE.md says so).

### Manual Validation
- [ ] Screenshot of the model in the browser read and confirmed
- [ ] One muscle highlights by name
- [ ] Licence wording in `CREDITS.md` matches the repo Readme

## Acceptance Criteria
- [ ] GLB loads in a browser with named, unique muscle meshes
- [ ] Size and load time recorded
- [ ] Seed mapping of about 15 muscles
- [ ] `CREDITS.md` written
- [ ] Go/no-go recorded in `FINDINGS.md`

## Completion Checklist
- [ ] Large files are git-ignored and not committed
- [ ] No secrets or machine paths in committed files
- [ ] No scope beyond phase 1

## Risks
| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Muscles not separable into named objects | L | H | Task 3 finds out early; fall back to another model |
| Names do not match TA2 | M | M | Build mapping table by hand for the seed set |
| GLB too large | M | M | Draco, decimate, or restrict to superficial layer |
| Zip is an LFS pointer | L | L | Check size in task 2 |
| Mirror-modifier/left-right handling | M | M | Inspect in task 3; note in findings |

## Notes
- Verified now: Blender 4.2.2 LTS is installed at `/Applications/Blender.app`; Node v25.2.1 and npm 11.6.2 present; the zip is 86,734,957 bytes; `TA2.csv` has 7,314 lines, 422 containing "muscle".
- Not verified: zip contents, collection layout, whether names survive export, Draco support, GLB size. These are what the spike measures.
- Complexity is small, but it is Sonnet-suitable only once task 3 settles the structure; tasks 3-4 involve unknowns and can go to an Opus agent if they stall.
- Confidence for single-pass implementation: 6/10, because the .blend layout is unknown.
