# STATE — MuscleAtlas

**Updated:** 2026-10-09

## Objective
Interactive male-anatomy tutor for a hackathon: an AI drives a 3D muscle model and explains what a muscle
does and how exercise trains it, citing only a verified facts file. PRD: `.claude/PRPs/prds/muscleatlas.prd.md`.

## Now
- Nothing in flight. Phases 1-3 are done and pushed (`main` = `3efe15f`); the site is live on GitHub Pages.

## Next
- [ ] Owner: pick the hackathon (DSH Hacks V2, UnivaBio, AIC Agentic AI) and get its deadline and judging rules.
- [ ] Load time: about 15 s on the dev server, mostly Draco decode of the 3.9 MB muscle GLB. Measure the deployed site first.
- [ ] Phase 4 (AI tutor): `/prp-plan` it. Decide first: Claude model, API key proxy (site is static), cost cap.
- [ ] Phase 4 prompt must rank evidence above dataset roles for hamstrings and calves, and say "abstract only" for Schoenfeld.
- [ ] Phase 5: credits, sample questions, demo script. Later: female anatomy; a purchased textbook as a facts source.

## Landmines
- Never add OpenStax to `src/facts/`: its terms forbid LLM ingestion. `facts.test.ts` fails on AI-use clauses in a licence.
- Gray 1918 quotes were verified against OCR text, not page images.
- The exercise dataset names muscle groups, not heads. Seated calf raise is a soleus move; it was removed from gastrocnemius.
- Blender 4.2.2 `export_materials="EXPORT"` crashes on this file; the export scripts use `PLACEHOLDER`.
- three.js renames GLB nodes (spaces to `_`); always look up with `sanitize()`.
- Headed Playwright `page.screenshot()` fires `pointerleave` and clears hover; use CDP `Page.captureScreenshot`.
- vitest is ^4 because this machine runs Node 25.2.1 (vitest 5 needs ^22.12 or ^24 or >=26).
- Pages source must stay "GitHub Actions"; "Deploy from a branch" serves raw source and overwrites the build.
- Commits carry no Claude trailer (owner's rule). The owner pushes `main` themselves; a hook blocks it for Claude.

## Open questions
- Which hackathon, deadline, team size, judging criteria? (not answered)
- PRD still has skipped answers: vision, job to be done, non-users, constraints, primary user (beginners vs anyone).
- Is exercise linking a v1 Must? (PRD lists it as Must, unconfirmed)
