# Decisions

One file per decision that would otherwise get re-litigated. Immutable once
written: to change a decision, add a new file and mark the old one superseded.

Filename: `NNNN-short-slug.md`, zero-padded, sequential.

```markdown
# 0001 — Short title

**Date:** YYYY-MM-DD
**Status:** accepted | superseded by 0007

## Context
What forced a choice. Constraints that were real at the time.

## Decision
What we do now, stated so it can be checked against the code.

## Consequences
What this costs, and what it rules out.

## Alternatives rejected
Each with the one reason it lost. This is the part that stops the
re-litigation — without it, the same alternative gets proposed every quarter.
```

These are not loaded automatically. Reference the relevant ones from CLAUDE.md
or STATE.md when they bear on current work.
