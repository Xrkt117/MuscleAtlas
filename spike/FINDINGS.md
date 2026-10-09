# Model spike findings (PRD phase 1)

Measured on 2026-10-09 with Blender 4.2.2 (headless), Node 25, three.js 0.170, Chrome via playwright-core,
Apple M5. Numbers marked (re-checked) were re-run by the main session after the spike agent reported;
browser load, FPS and render observations are the agent's own and were not re-run.

## Decision: go with fixes

The Z-Anatomy male muscle layer exports to a GLB with 485 uniquely named nodes (re-checked). 241 of the 244
distinct base names are TA2 terms (re-checked). The GLB renders in a browser and a single named muscle can
be turned red (agent-observed from screenshots). Fix these in and before phase 2:

1. **A muscle is a list of nodes, not one node.** Many muscles exist only as parts (biceps = long head +
   short head; deltoid = 3 parts; no `Biceps brachii muscle.l` node). The mapping is `muscle_id -> [node names]`.
2. **Materials are placeholders.** `export_materials="EXPORT"` crashes the 4.2.2 exporter (IndexError in
   `gltf2_blender_search_node_tree.py` on Z-Anatomy's node-group materials). The spike uses `PLACEHOLDER`, so
   the viewer assigns its own materials. Primitives stay split per Blender material (muscle vs tendon), so
   three.js creates 712 meshes for 485 nodes.
3. **Frame rate needs a check in a real browser.** Automated windows measured 19-23 fps with 712 meshes.
   If an interactive browser is also slow, merge tendon primitives or cut draw calls.
4. **Serve the Draco file** (3.9 MB vs 20.2 MB). Draco decode costs about 5 s on localhost.

## Source and structure

- `Z-Anatomy.zip` from `master` via raw.githubusercontent.com: 86,734,957 bytes, the real file (not an LFS
  pointer). It holds `Startup.blend` (306,838,281 bytes). The .blend was opened with `--disable-autoexec`.
- Muscle layer: collection `4: Muscular system`, 894 objects (789 meshes, 105 FONT), 1,075,358 vertices
  before modifiers, all directly in that collection; hierarchy is by object parenting.
  - `X.g` FONT objects are group labels. `X.j` (105 meshes, 2 vertices) are leader lines, skipped.
    `Muscular system.g` is a root label, skipped.
  - Muscles are `<TA2 English name>.l` / `.r` pairs sharing one mesh; the left is mirrored by a
    negative-scale parent transform.
  - Fasciae, bursae and tendon sheaths are excluded (not muscles; fasciae cover muscles).
  - No `.001` suffixes. 4 nodes have no side: `Diaphragm`, `Linea alba`, `Transverse arytenoid muscle`,
    `Iliocostalis colli muscle` (source quirk, no partner).
  - 6 nodes have names wrapped in parentheses, e.g. `(Abdominal part of pectoralis major muscle).l`; they
    include all 3 non-TA2 names.

## Export (`spike/export_muscles.py`)

Options chosen after reading `bpy.ops.export_scene.gltf.get_rna_type()`: `export_format="GLB"`,
`use_selection=True`, `use_visible=False`, `use_renderable=False`, `export_apply=True`, `export_yup=True`,
`export_materials="PLACEHOLDER"`, animations/cameras/lights off, Draco on or off.

| Output | Bytes | Export time |
|---|---|---|
| `spike/data/muscles.glb` (no Draco) | 20,172,280 (re-checked) | 8.5 s |
| `spike/data/muscles-draco.glb` | 3,860,020 (re-checked) | ~9 s |

## Name check (`spike/check_glb.mjs`, non-Draco GLB; re-run, exit 0)

| Check | Result |
|---|---|
| Nodes with a mesh | 485 (481 sided, 4 unsided) |
| Meshes | 246 (left/right share a mesh) |
| Vertices | 577,925 unique; 1,134,499 drawn |
| Duplicate names | 0, also 0 after three.js sanitising |
| Base names not in TA2 | 3 of 244: `Abdominal part of pectoralis major muscle`, `Adductor minimus`, `Opponens digiti minimi muscle of foot` |

**three.js gotcha:** GLTFLoader sanitises node names (whitespace to `_`, strips `[ ] . : /`), so
`Latissimus dorsi muscle.r` becomes `Latissimus_dorsi_muscler`. Look nodes up with
`getObjectByName(sanitize(name))`, as `spike/view.html` does. A two-primitive node loads as a Group, so
highlights must traverse it.

## Load in browser (`spike/view.html`; agent-measured, localhost, ANGLE Metal on Apple M5)

| File | Load | First frame after load | FPS |
|---|---|---|---|
| muscles.glb | 3.5 s | +2.1 to 2.4 s | 21-23 |
| muscles-draco.glb | 8.7-8.9 s (decoder from CDN) | +3.0 to 3.1 s | 19-20 |

Render check (agent read the screenshots; not kept): full figure renders in front view;
`Latissimus dorsi muscle.r` and `Long head of biceps brachii.l` turned red on the correct sides. Draco and
non-Draco look the same. Not verified: interactive-window FPS, Draco names via `check_glb.mjs`, gltfpack/meshopt.

## Seed mapping (15 muscles)

Each node exists as `<name>.l` and `<name>.r` (parentheses are part of the name). The agent checked all 58
names against the `--list` output.

| Muscle id | TA2 English | Nodes |
|---|---|---|
| pectoralis_major | Pectoralis major muscle | `Clavicular head of pectoralis major muscle`, `Sternocostal head of pectoralis major muscle`, `(Abdominal part of pectoralis major muscle)` |
| deltoid | Deltoid muscle | `Clavicular part of deltoid muscle`, `Acromial part of deltoid muscle`, `Scapular spinal part of deltoid muscle` |
| latissimus_dorsi | Latissimus dorsi muscle | `Latissimus dorsi muscle` |
| trapezius | Trapezius muscle | `Descending part of trapezius muscle`, `Transverse part of trapezius muscle`, `Ascending part of trapezius muscle` |
| serratus_anterior | Serratus anterior muscle | `Serratus anterior muscle` |
| biceps_brachii | Biceps brachii muscle | `Long head of biceps brachii`, `Short head of biceps brachii` |
| triceps_brachii | Triceps brachii muscle | `Long head of triceps brachii`, `Lateral head of triceps brachii`, `Medial head of triceps brachii` |
| rectus_abdominis | Rectus abdominis muscle | `Rectus abdominis muscle` |
| gluteus_maximus | Gluteus maximus muscle | `Gluteus maximus muscle` |
| quadriceps_femoris | Quadriceps femoris muscle | `Rectus femoris muscle`, `Vastus lateralis muscle`, `Vastus medialis muscle`, `Vastus intermedius muscle` |
| biceps_femoris | Biceps femoris muscle | `Long head of biceps femoris`, `Short head of biceps femoris` |
| semitendinosus | Semitendinosus muscle | `Semitendinosus muscle` |
| semimembranosus | Semimembranosus muscle | `Semimembranosus muscle` |
| gastrocnemius | Gastrocnemius muscle | `Medial head of gastrocnemius`, `Lateral head of gastrocnemius` |
| soleus | Soleus muscle | `Soleus muscle` |

"Hamstrings" is not a TA2 term, so it is three rows.

## Reproduce

```bash
B=/Applications/Blender.app/Contents/MacOS/Blender
BLEND=spike/data/zanatomy/Startup.blend        # from Z-Anatomy.zip
$B --background --disable-autoexec $BLEND --python spike/inspect_blend.py -- spike/data/inspect.txt
$B --background --disable-autoexec $BLEND --python spike/export_muscles.py -- "$PWD/spike/data/muscles.glb"
$B --background --disable-autoexec $BLEND --python spike/export_muscles.py -- "$PWD/spike/data/muscles-draco.glb" draco
(cd spike && npm ci)
node spike/check_glb.mjs spike/data/muscles.glb spike/data/zanatomy/TA2.csv --list   # exit 1 on empty/duplicates
python3 -I -m http.server 8765 --bind 127.0.0.1 -d spike
# http://127.0.0.1:8765/view.html?file=data/muscles.glb&hl=Latissimus%20dorsi%20muscle.r
```

## Open issues for phase 2

- The GLB is a CC BY-SA 4.0 derivative; publish it under that licence (`CREDITS.md`).
- No size threshold decided; 3.9 MB with Draco seems fine for a demo.
- Deep muscles sit under superficial ones: phase 2 needs hide/ghost or camera focus.
- Fasciae, bursae and tendon sheaths can be added back by changing the `SKIP` pattern.
