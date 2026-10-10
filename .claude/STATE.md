# STATE — MuscleAtlas

**Updated:** 2026-10-09 (night)

## Objective
Interactive male-anatomy tutor for a hackathon: an AI drives a 3D muscle model and explains what a muscle
does and how exercise trains it, citing only a verified facts file. PRD: `.claude/PRPs/prds/muscleatlas.prd.md`.

## Now
- Nothing in flight. `main` has 10 local commits not pushed (origin/main = 9e3d5b0, a contributor's tip). They contain
  the corrected Gray quotes, the chip cap, the rail fix, a progress clamp and a favicon. The LIVE site still shows the
  contributor's six quotes that are not in the book; push soon: `! git push origin main`.

## Next
- [ ] Owner pushes now; then hand-check the live site (screenshots are not the hand check).
- [ ] Owner: who is the `spertia` contributor? Agree a rule: facts need the verbatim-quote check before merging. Optional: a test that
      fails when a quote is not in the source text (needs the OCR text vendored or fetched).
- [ ] Owner: pick the hackathon (DSH Hacks V2, UnivaBio, AIC Agentic AI) and its deadline and judging rules.
- [ ] Phase 4 AI tutor: `/prp-plan` it. Decide Claude model, key proxy (site is static), cost cap. The prompt must rank
      evidence above dataset roles (hamstrings, calves) and flag Abstract-only / Single study / Group finding claims.
      The panel and callouts are its tools (`atlas.highlight/focus`, `renderPanel`).
- [ ] Owner decision: add `happy-dom` (dev dependency) for DOM tests of panel rendering, callout lifecycle, rail keyboard flow?
- [ ] Phase 5: credits, sample questions, demo script. Later: female anatomy; a purchased textbook as a facts source.
- [ ] Minor: a 404 on every page load (probably favicon); Fable review not run on the UI (Fable credits ran out; Opus reviewed).

## Landmines
- A contributor (`spertia`) pushed facts with 6 quotes that were not verbatim; the tests only check structure. Always run the
  exact-substring check against the source text before trusting any `muscles.json` quote. Muscle ids/labels: `rectus_abdominis` is
  labelled "Abdominals" (covers obliques); Lateral_Bound is listed as a primary adductor exercise (dataset says so).
- Never add OpenStax to `src/facts/` (forbids LLM ingestion); `facts.test.ts` guards licences.
- Gray 1918 quotes were checked against OCR text, not page images. The dataset names muscle groups, not heads.
- Measure performance with the ARM64 node (`file $(which node)` must say arm64). The default x86_64 node gave ~4-10x worse
  numbers (ADR 0006); everything quoted before that finding (15 s load, 30-50 fps, hover stalls) was wrong.
- `window.atlas` is public and the tutor will call it: `callouts.update` rebuilds from `FrameInfo.id`; keep listeners try/caught.
- Blender 4.2.2 `export_materials="EXPORT"` crashes; scripts use `PLACEHOLDER`. three.js renames nodes: use `sanitize()`.
- Headed Playwright `page.screenshot()` fires `pointerleave`; use CDP `Page.captureScreenshot`.
- vitest is ^4 (Node 25.2.1). Pages source must stay "GitHub Actions".
- Commits carry no Claude trailer. A plugin hook blocks Claude from pushing main; the owner pushes.

## Open questions
- Which hackathon, deadline, team size, judging criteria? PRD skipped answers: vision, JTBD, non-users, constraints.
- Phase 4 inputs: Claude model, API-key proxy, cost cap.
- Is exercise linking a v1 Must? Exercises are in the data but the panel omits them (owner's choice).
