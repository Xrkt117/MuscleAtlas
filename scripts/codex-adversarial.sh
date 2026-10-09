#!/usr/bin/env bash
# Adversarial review by Codex (gpt-5.6-sol) of a commit range, read-only, over a plain snapshot of <head>
# (same isolation as codex-review.sh: snapshot() in codex-lib.sh). Where the cold
# review looks for defects, this one attacks: it must construct concrete inputs, sequences or states that
# break the change, and say how it would prove each one. The plan is handed in on purpose, so it can also
# attack the gap between what was promised and what was built.
#
#   scripts/codex-adversarial.sh <base>..<head> "what the change claims to guarantee" [plan.md ...]
set -euo pipefail
. "$(dirname "$0")/codex-lib.sh"
range=$1; claim=$2; shift 2
head=${range##*..}
wt=$(mktemp -d); out=$(mktemp); log=${CODEX_LOG:-$(mktemp)}
trap 'rm -rf "$wt"' EXIT
snapshot "$head" "$wt"
mkdir -p "$wt/.codex-input"
safe_diff "$range" > "$wt/.codex-input/range.diff"
names=(.codex-input/range.diff)
for d in "$@"; do cp "$d" "$wt/.codex-input/"; names+=(".codex-input/$(basename "$d")"); done
prompt=$(cat <<'PROMPT'
Read CLAUDE.md first. You are the adversary for the change in .codex-input/range.diff. Also read: __NAMES__.

The change claims: __CLAIM__

Try to break that claim. For each attack give: (1) the concrete input, call sequence, concurrency interleaving, restart, or data state; (2) the file:line where it goes wrong; (3) the observable failure; (4) the smallest test that would prove it. Prefer attacks on trust boundaries, error and retry paths, persistence across restarts, and anything the plan promised that the diff does not deliver. Discard any attack you cannot tie to a line. If nothing survives, say "claim holds" and name the two attacks that came closest. Be brief.
PROMPT
)
namesJoined="${names[*]}"
prompt=${prompt//__NAMES__/$namesJoined}
prompt=${prompt//__CLAIM__/$claim}
(
  cd "$wt"
  printf '%s' "$prompt" | codex exec --skip-git-repo-check -m gpt-5.6-sol -s read-only -o "$out" - >"$log" 2>&1
)
cat "$out"
echo "(transcript: $log)" >&2
