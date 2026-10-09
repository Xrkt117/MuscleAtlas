#!/usr/bin/env bash
# Cold review by Codex (gpt-6-astra) of a commit range, read-only, over a plain snapshot of <head>.
# `git archive` copies tracked files only, into a fresh temp dir with no .git: untracked secrets and data
# (.env, local datasets, build output) are unreachable because they were never tracked. The diff is computed
# here, in the real repo, and handed in as a file. Plans and reports are withheld from the prompt so the
# reviewer judges the code, not the intent. PNG screenshots can be attached for a layout pass.
#
#   scripts/codex-review.sh <base>..<head> "focus text" [screenshot.png ...]
#
# Requires: `codex login status` OK, the range reachable from this repo.
set -euo pipefail
. "$(dirname "$0")/codex-lib.sh"
range=$1; focus=$2; shift 2
head=${range##*..}
wt=$(mktemp -d); out=$(mktemp); log=${CODEX_LOG:-$(mktemp)}
trap 'rm -rf "$wt"' EXIT
snapshot "$head" "$wt"
mkdir -p "$wt/.codex-input"
safe_diff "$range" > "$wt/.codex-input/range.diff"
imgs=(); for i in "$@"; do imgs+=(-i "$(realpath "$i")"); done
# The heredoc delimiter is quoted (no expansion inside it); the focus text is spliced in afterwards with a
# bash string replace, so it is never re-parsed as shell.
prompt=$(cat <<'PROMPT'
Read CLAUDE.md first: it carries the build rules and the landmines this codebase has already paid for. Do not read .claude/PRPs/plans or .claude/PRPs/reports (this is a cold review). The change under review is in .codex-input/range.diff; screenshots, if attached, show the app after that change.

Review for: __FOCUS__

Report numbered findings, each with file:line and the concrete scenario that fails, severity first. Skip style. If nothing survives scrutiny, say "no findings". Be brief.
PROMPT
)
prompt=${prompt//__FOCUS__/$focus}
(
  cd "$wt"
  printf '%s' "$prompt" | codex exec --skip-git-repo-check -m gpt-6-astra -s read-only -o "$out" ${imgs[@]+"${imgs[@]}"} - >"$log" 2>&1
)
cat "$out"
echo "(transcript: $log)" >&2
