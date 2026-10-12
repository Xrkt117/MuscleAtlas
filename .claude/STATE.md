# STATE — MuscleAtlas

**Updated:** 2026-10-11

## Objective
Interactive male-anatomy tutor for a hackathon: an AI drives a 3D muscle model and explains what a muscle
does and how exercise trains it, citing only a verified facts file. PRD: `.claude/PRPs/prds/muscleatlas.prd.md`.

## Now
- Nothing in flight. The workout-focused flat UI (ADR 0007) is pushed: `origin/main` = `8e364a8` (part picking and hover,
  per-part callouts, right-hand side panel with Exercises and Anatomy tabs, always-visible muscle list). 128 tests pass,
  typecheck and both builds clean. The Pages deploy and the live site were NOT checked yet.
- Local `main` still holds two superseded commits (`ec24084`, `56f686e`); `git switch main && git reset --hard origin/main` when
  ready. Branch `workout-ui` and `backup-workout-ui-pre-rebase` can go after the live check.

## Next
- [ ] Polish (found in the last screenshots): the muscle list is clipped at 1440x900 (scrolls inside the rail); leader lines
      cross when part anchors sit close (pectoralis Abdominal part, deltoid); at an oblique camera some part labels vanish
      (pectoralis at 1024x768 shows only Sternocostal). Fix lives in `viewer.ts` anchors: put each anchor inside the part's visible surface.
- [ ] Check the live site by hand (Pages deploy status, narrow layouts <900 and <600 px, keyboard: Esc order, Shift+Enter in the Mixer,
      tab arrows, right-click mix). Optional: part-hover emphasis of the matching callout label.
- [ ] Independent reviews on the viewer/part-pick changes (security, performance, architecture); Fable credits are out, use Opus.
- [ ] Owner: pick the hackathon and get its deadline; agree how `spertia`'s work is reviewed (their history was force-rewritten once).
- [ ] Phase 4 AI tutor: a worker proxy and chat UI already landed from `spertia`; decide model, key and cost cap, and plan the rest.
- [ ] Exercise images: real photos are NOT usable (free-exercise-db licence unresolved, upstream issue #13). A model-view image was
      built, then removed at the owner's request. Illustrations would have to be our own.
- [ ] PRD: exercise linking is now a confirmed Must; the "No codebase exists yet" line is stale.

## Landmines
- origin/main was force-pushed once (history rewritten, authors changed to `spertia`): always `git fetch` and compare content
  before assuming a fast-forward. The owner pushes `main` (`! git push origin <branch>:main`); Claude cannot.
- Measure performance with the ARM64 node (`file $(which node)` must say arm64); the default x86_64 node gave 4-10x worse
  numbers (ADR 0006, `CLAUDE.local.md`). Headed Playwright `page.screenshot()` clears hover; use CDP `Page.captureScreenshot`.
- Never add OpenStax to `src/facts/` (forbids LLM ingestion). Gray quotes were checked against OCR text, not page images.
- `rectus_abdominis` is labelled "Abdominals" (covers obliques); Lateral_Bound is a listed "primary" adductor exercise (dataset
  says so). Both are judgement calls left to the owner.
- Exercise copy is a dataset listing, never a ranking or evidence of benefit; dataset groups are regions, not muscle heads.

## Open questions
- Which hackathon, deadline, team size, judging criteria?
- Phase 4 inputs: Claude model, API-key proxy, cost cap.
