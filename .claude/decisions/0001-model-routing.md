# 0001 — Model routing

**Date:** 2026-10-07
**Status:** accepted

## Context
Several models are used so that review comes from a model that did not write the code. A model reviewing
its own work misses what it assumed while writing.

## Decision
| Role | Model |
|---|---|
| Plans | Opus 5.5 (main session) |
| Codes | Sonnet 5.5 (Agent `model: "sonnet"`) |
| Hard debugging, design calls | Opus 5.5 (Agent `model: "opus"`) |
| Reviews | Fable (Agent `model: "fable"`) |
| Cold review, second opinion | Codex `gpt-6-astra` |
| Adversarial review | Codex `gpt-5.6-sol` |

## Consequences
- Codex must be logged in (`codex login status`); each review costs money and time.
- Sonnet agents need disjoint file lists.
- Codex stays read-only.

## Alternatives rejected
- **One model for everything:** it would review its own work.
- **Coding with Codex:** tried 2026-09-22 to 09-30 on flipapp and cameratracker. No measured edge over
  Sonnet, its sandbox blocks Gradle and sockets so the main session still validated every round, and it
  took the weekly Codex limit from about 15% to 92%. Codex earns its cost as an independent reviewer (it
  found defects three Opus reviews missed); that independence is lost if it also writes the code.
