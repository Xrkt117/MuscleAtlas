# Implementation Report: Model spike

## Summary
Tasks 1-9 of the plan were run by an Opus agent; the main session re-checked the file list, `.gitignore`,
the PRD change, `CREDITS.md`, and re-ran `check_glb.mjs` (exit 0). `spike/FINDINGS.md` was written by the
main session from the agent's report because the agent's harness blocked that file name.

## Assessment vs Reality
| Metric | Predicted | Actual |
|---|---|---|
| Complexity | Small | Small-Medium (export crash, 2 workarounds) |
| Confidence | 6/10 | Worked; layout was friendlier than feared |
| Files changed | 6 | 9 tracked-or-new files plus ignored data |

## Validation
| Level | Status | Notes |
|---|---|---|
| Static analysis / unit tests / build | N/A | No stack commands exist yet |
| `check_glb.mjs` | Pass | 485 nodes, 0 duplicates, 3 non-TA2 base names |
| Browser render | Agent-observed | Screenshots read by the agent; not re-run by main session |
| FPS in a real window | Not verified | 19-23 fps in automated windows only |

## Deviations
- `export_materials="PLACEHOLDER"` instead of `EXPORT` (Blender 4.2.2 exporter crashes on node-group materials).
- Added `spike/node_modules/` to `.gitignore`, `spike/package.json` and lockfile.
- Playwright-core was installed in the scratchpad, not the repo.

## Next Steps
- [ ] Review the spike diff, then commit
- [ ] `/prp-plan` phase 2 (viewer) and phase 3 (facts file), which can run in parallel
