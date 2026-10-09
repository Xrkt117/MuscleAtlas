# STATE — MuscleAtlas

**Updated:** 2026-10-09 (late)

## Objective
Interactive male-anatomy tutor for a hackathon: an AI drives a 3D muscle model and explains what a muscle
does and how exercise trains it, citing only a verified facts file. PRD: `.claude/PRPs/prds/muscleatlas.prd.md`.

## Now
- Layout A info panel + 3D callouts are BUILT BUT UNCOMMITTED in the working tree (`src/panel.ts`, `callouts.ts`,
  `style.css`, `visibility.*`, edits to `viewer.ts`, `main.ts`, `index.html`). Typecheck, 78 tests, build pass;
  screenshots of 5 muscles looked right.
- BLOCKER: anchor precompute hitches frames for up to 1.4 s after load (surfaceAnchor allocates per triangle).
  A Sonnet agent is rewriting `src/anchors.ts` (allocation-free, 20k-triangle sample cap); `anchors.test.ts` is
  mid-edit. Do not commit the UI until the idle-hitch A/B (HEAD vs working tree, first 12 s after load) is clean.

## Next
- [ ] Re-run typecheck/tests/build, re-measure the idle window, then micro-commit the UI, Fable-review the diff.
- [ ] Small flaws: list pill truncates long names ("Latissimus do..."); `#selected` is visually hidden (still aria-live).
- [ ] Owner pushes (8 local commits plus the UI): `! git push origin main`.
- [ ] Owner: pick the hackathon (DSH Hacks V2, UnivaBio, AIC Agentic AI) and its deadline and judging rules.
- [ ] Load time about 15 s on the dev server (Draco decode); measure the deployed site.
- [ ] Phase 4 AI tutor: `/prp-plan` it; decide Claude model, key proxy (site is static), cost cap. Prompt must rank
      evidence above dataset roles (hamstrings, calves) and flag abstract-only claims. Panel/callouts become its tools.

## Landmines
- Never add OpenStax to `src/facts/` (forbids LLM ingestion); `facts.test.ts` guards licences.
- Gray 1918 quotes were checked against OCR text, not page images. The dataset names muscle groups, not heads.
- Evidence flags: `general` and `caveat` are explicit fields; `appliesTo` can't define "general" (claim 0 lists 14 muscles).
- Blender 4.2.2 `export_materials="EXPORT"` crashes; scripts use `PLACEHOLDER`. three.js renames nodes: use `sanitize()`.
- Headed Playwright `page.screenshot()` fires `pointerleave`; use CDP `Page.captureScreenshot`.
- vitest is ^4 (Node 25.2.1). Pages source must stay "GitHub Actions".
- Commits carry no Claude trailer. A plugin hook blocks Claude from pushing main; the owner pushes.
- Idle-frame precompute work must stay cheap: first 12 s after load is where hitches show.

## Open questions
- Which hackathon, deadline, team size, judging criteria? PRD skipped answers: vision, JTBD, non-users, constraints.
- Is exercise linking a v1 Must? Exercises are in the data but the panel deliberately omits them (owner's choice).
