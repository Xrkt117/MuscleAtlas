# MuscleAtlas

<!-- Target: under 200 lines. Facts that are true every session — commands,
     conventions, layout, and pitfalls that differ from tool defaults.
     Run `/init` to have Claude fill this in from the codebase, then trim. -->

## Commands
- `npm run dev` - Vite dev server
- `npm run build` - production build into `dist/`
- `npm test` - Vitest, single run
- `npm run typecheck` - `tsc --noEmit`

## Layout
- `src/` - app code (`viewer.ts` is the three.js viewer and `AtlasApi`; `muscle-map.ts` the 15 seed muscles)
- `public/models/` - the Draco GLBs (`muscles-draco.glb`, plus `skeleton-draco.glb` as unselectable decoration); `public/draco/` - local Draco decoder files
- `src/facts/` - cited facts the AI tutor may use; every claim has a source id and a verbatim quote
- `spike/` - throwaway research (model export and checks); do not build on it
- `.claude/PRPs/` - PRDs and plans

## Conventions
<!-- rules that differ from the framework default; skip the ones that don't -->

## Model routing (project rule)

- **Plan** with Opus 5.5, the main session: PRDs, `/prp-plan`, architecture decisions, and the decision of
  what ships. The main session does not write application code itself; it writes briefs, runs the
  builds and tests, reads every diff, and talks to the owner.
- **Code** with Sonnet: every implementation task is an Agent with `model: "sonnet"` and a brief that names
  the plan path, the task list, the files it may touch, the hard rules, the validation commands and the
  report format. Two agents never work on neighbouring files at the same time: keep their file lists
  disjoint. Sonnet 5.5 is for well-specified work (a written plan, mechanical edits, tests). Hard
  debugging or a design call goes to an Agent with `model: "opus"` instead.
- **Review** with Fable: after each implementation task, one review Agent with `model: "fable"`
  (`dev-kit:architect`, read-only). At the end of a phase, three reviews on the phase diff: security
  (`dev-kit:security-reviewer`), performance (`dev-kit:performance-optimizer`) and architecture
  (`dev-kit:architect`). Findings go back to a Sonnet agent to fix; Fable re-reviews only what changed.
- **Cold review** with Codex astra (`gpt-6-astra`): `scripts/codex-review.sh <base>..<head> "focus"`,
  read-only, on a snapshot with no untracked files. At phase end on the whole phase diff. Hand it the whole
  change, never a partial diff.
- **Adversarial review** with Codex sol (`gpt-5.6-sol`): `scripts/codex-adversarial.sh <base>..<head>
  "what the change guarantees" [plan.md]`. At phase end, and on any change whose failure would lose data.
- **Second opinion** with Codex astra: `scripts/codex-opinion.sh "question" doc.md …`. For a PRD before its
  plan, a plan before coding, a decision before its ADR. A check, not a vote: an owner decision stands.
- A finding already rejected with a reason is not re-argued; a new one is.
- **The main session re-runs every suite after each round and reports counts** (`N passed, M failed`),
  never "ok".

## Working rules

- Work on `main`; separate concerns are separate commits. Commit only when the owner asks.
- Commit messages go through a file (`git commit -F <file>`), never an inline heredoc.
- Machine-local facts go in `CLAUDE.local.md`, which is git-ignored, never in this file.
- Secrets are never printed, logged or pasted into a prompt.
- State what was verified and how, separately from what is inferred.
- Stack is Vite + TypeScript + three.js 0.170.0 (pinned). No lint tool is installed yet.

@.claude/STATE.md
