# STATE — MuscleAtlas

**Updated:** 2026-10-11 (evening)

## Objective
Submit MuscleAtlas to the AIC Internal Competition 2026 (Agentic AI, Devpost), due **2026-10-12 00:00 EDT**. The pitch: a
tool-calling agent that drives the 3D muscle model and cites only verified facts. Judging: Functionality 20, Agentic 20,
Creativity 20, Devpost write-up 25, Usefulness 15. The submission needs the write-up, the repo, run instructions and a demo video.

## Now
- The agent loop is built but **uncommitted** on branch `workout-ui` (HEAD `1e02119` = origin/main + checkpoint). See ADR 0008.
  Files: `src/agent-tools.ts`(+test), `src/chat.ts`, `src/main.ts`, `src/style.css`, `worker/src/index.js`(+test), `README.md`, `.gitignore`.
  150 tests pass, typecheck clean, build OK. **Never run against real OpenAI**: `worker/.dev.vars` (the key) is still missing.
- Running locally: wrangler on :8787 (from `worker/`), Vite on :5173 with `.env.local` = `VITE_CHAT_API_URL=http://localhost:8787`.

## Next
1. The owner puts the key in `worker/.dev.vars`. Then run live: "Build a 30-minute dumbbell push workout and show me what it trains"
   should give 3+ trace steps, highlights, a camera move and a cited answer, and "show me the biceps" should recover via list_muscles.
   If the API rejects a parameter, check `include`/`max_output_tokens` first (they weren't verified in the docs).
2. Ergonomics quick wins from the screenshot review (one Sonnet agent): a labelled "Ask the AI coach" launcher, a landing hint, 3
   one-click goal chips in the chat, removing the stale "Mixer: close this panel…" paragraph in `index.html`, fixing the clipped
   muscle list, opening the Mixer automatically on the first add, and `resetView()` when show_muscles gets several ids.
3. The owner asks to commit. Then the owner pushes (`! git push origin workout-ui:main`).
4. Devpost: the draft is in the session scratchpad (`devpost.md`, not in the repo). Re-check its claims against the live run, then
   record the demo video (goal chips, trace, recovery).
- After the hackathon: callout anchor polish (missing deltoid posterior label, crossing lines), live Pages check, Opus reviews,
  PRD refresh, and a decision on whether to deploy the worker.

## Landmines
- A `!` command runs in the session's current directory: `npm run dev` from `worker/` starts wrangler, not the site.
- An old Vite left on :5173 from an earlier session won't see a new `.env.local`; restart it.
- `vitest --root /` crawls the whole disk; never do that. Headless screenshot setup is in `CLAUDE.local.md`.
- origin/main was force-pushed once: `git fetch` and compare before assuming a fast-forward. Claude cannot push main.
- Never add OpenStax to `src/facts/`. Exercise copy is a dataset listing, never a ranking.

## Open questions
- Deploy the worker for judges to try, or local demo only? (Currently local only, by the owner's choice.)
