# Sourced by the codex-*.sh scripts. Builds the snapshot Codex reads and keeps secrets out of it.
#
# `git archive` already leaves untracked files behind. This also removes secret-shaped files that were
# committed by mistake (a tracked .env is common), from both the snapshot and the diff, because a review
# must never be the way a key leaves the machine. A repo adds its own globs in .codex-exclude, one per line;
# a glob with a slash matches a path from the repo root, one without matches a file name anywhere.

SECRET_GLOBS=('.env' '.env.*' '*.pem' '*.key' '*.p12' '*.pfx' '*.jks' '*.keystore' 'id_rsa*' 'id_ed25519*'
              'CLAUDE.local.md' 'local.properties' 'credentials.json' 'service-account*.json')
_root=$(git rev-parse --show-toplevel)
if [ -f "$_root/.codex-exclude" ]; then
  while IFS= read -r g; do
    case "$g" in ''|'#'*) ;; *) SECRET_GLOBS+=("$g") ;; esac
  done < "$_root/.codex-exclude"
fi

# snapshot <rev> <dir>: extract <rev> into <dir> and strip the secret globs; reports what it removed.
snapshot() {
  git archive "$1" | tar -x -C "$2"
  local g n=0 f
  for g in "${SECRET_GLOBS[@]}"; do
    while IFS= read -r -d '' f; do rm -rf "$f"; n=$((n + 1)); done \
      < <(find "$2" \( -name "$g" -o -path "$2/$g" \) -print0)
  done
  [ "$n" -gt 0 ] && echo "codex: removed $n secret-shaped file(s) from the snapshot; if any is tracked, untrack it and rotate what it holds" >&2
  return 0
}

# safe_diff <range>: the diff with the same globs excluded.
safe_diff() {
  local specs=(. ) g
  for g in "${SECRET_GLOBS[@]}"; do
    case "$g" in */*) specs+=(":(glob,exclude)$g") ;; *) specs+=(":(glob,exclude)**/$g") ;; esac
  done
  git diff "$1" -- "${specs[@]}"
}
