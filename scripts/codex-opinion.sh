#!/usr/bin/env bash
# Second opinion by Codex (gpt-6-astra) on something the team settled: a PRD, a plan, a decision, a feature
# shape. The documents are copied into a plain snapshot of HEAD (git archive: no .git, untracked secrets and
# data unreachable), so an uncommitted draft is visible to Codex only through the explicit copies below.
# Codex may read the code to check the claims. Asks for the case against first, then a verdict, so a bare
# "looks good" cannot come back.
#
#   scripts/codex-opinion.sh "the question" doc.md [more.md ...]
#   printf 'what we settled…' | scripts/codex-opinion.sh "the question" -     (the settlement on stdin)
set -euo pipefail
. "$(dirname "$0")/codex-lib.sh"
question=$1; shift
wt=$(mktemp -d); out=$(mktemp); log=${CODEX_LOG:-$(mktemp)}
trap 'rm -rf "$wt"' EXIT
snapshot HEAD "$wt"
mkdir -p "$wt/.codex-input"
names=()
for d in "$@"; do
  if [ "$d" = - ]; then cat > "$wt/.codex-input/settled.md"; names+=(.codex-input/settled.md)
  else cp "$d" "$wt/.codex-input/"; names+=(".codex-input/$(basename "$d")"); fi
done
prompt=$(cat <<'PROMPT'
Read CLAUDE.md first: it carries the invariants of this project and the landmines already paid for. Then read: __NAMES__. These describe something the team has settled on. You may read the code to check any claim they make; do not read .claude/PRPs/reports.

Question: __QUESTION__

Answer in this order, briefly: (1) the strongest case against what was settled: what breaks, what is simpler, what was missed, each tied to a file or an invariant where possible; (2) what you would change, concretely; (3) a one-line verdict: agree / agree with the changes above / disagree. No praise, no restating the document.
PROMPT
)
namesJoined="${names[*]}"
prompt=${prompt//__NAMES__/$namesJoined}
prompt=${prompt//__QUESTION__/$question}
(
  cd "$wt"
  printf '%s' "$prompt" | codex exec --skip-git-repo-check -m gpt-6-astra -s read-only -o "$out" - >"$log" 2>&1
)
cat "$out"
echo "(transcript: $log)" >&2
