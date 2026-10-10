# STATE — MuscleAtlas

**Updated:** 2026-10-10

## Objective
Interactive male-anatomy tutor for a hackathon: an AI drives a 3D muscle model and explains what a muscle
does and how exercise trains it, citing only a verified facts file. PRD: `.claude/PRPs/prds/muscleatlas.prd.md`.

## Now
- Nothing in flight. Phases 1-3 and the spacious UI (floating panels, cited info panel, callouts, list rail, 17 muscles)
  are done, reviewed, pushed (`origin/main` = `5cea0f2`) and verified live in native Chrome (loads in about 2 s, no console errors).

## Next
- [ ] Owner: hand-check the live site (screenshots are not the hand check); pick the hackathon (DSH Hacks V2, UnivaBio, AIC
      Agentic AI) and get its deadline and judging rules.
- [ ] Owner: who is the `spertia` contributor? Agree how their facts get reviewed. Optional: a test that fails when a quote
      is not in the source text.
- [ ] Phase 4 AI tutor: `/prp-plan` it. Decide Claude model, key proxy (site is static), cost cap. The prompt must rank
      evidence above dataset roles (hamstrings, calves) and flag Abstract only / Single study / Group finding claims.
      Tools: `atlas.highlight/focus`, `renderPanel`; `window.atlas` is public, so bad calls must never freeze the loop.
- [ ] Owner decision: add `happy-dom` (dev dependency) for DOM tests of the panel, callout lifecycle and rail keyboard flow?
- [ ] Phase 5: credits, sample questions, demo script. Later: female anatomy; a purchased textbook as a facts source.

## Landmines
- Measure performance with the ARM64 node (`file $(which node)` must say arm64); the default x86_64 node gave 4-10x worse
  numbers (ADR 0006, `CLAUDE.local.md`). Headed Playwright `page.screenshot()` clears hover; use CDP `Page.captureScreenshot`.
- Never add OpenStax to `src/facts/` (forbids LLM ingestion). Gray quotes were checked against OCR text, not page images.
- `rectus_abdominis` is labelled "Abdominals" (covers obliques); Lateral_Bound is a listed "primary" adductor exercise (dataset
  says so). Both are judgement calls left to the owner.
- Fable credits ran out; the UI was reviewed by Opus, not Fable.

## Open questions
- Which hackathon, deadline, team size, judging criteria? PRD skipped answers: vision, JTBD, non-users, constraints.
- Phase 4 inputs: Claude model, API-key proxy, cost cap.
- Is exercise linking a v1 Must? Exercises are in the data but the panel omits them (owner's choice).
