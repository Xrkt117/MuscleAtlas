# 0006 — Performance is measured in native arm64 Chrome; GPU picking stays but its reason is corrected

**Date:** 2026-10-09
**Status:** accepted (partially supersedes the rationale of 0003)

## Context
Every headed-Chrome measurement in this project up to now was launched by Playwright from the machine's default `node`,
which is an x86_64 build. On Apple silicon that very likely made Chrome run translated (Rosetta): the same script, dev server and
Chrome app gave a 33 ms median frame time with the x86_64 node and 8.3 ms with the arm64 node, and a subagent's isolation test
(first call of one function: 1.3 ms on arm64 Chrome vs 280-520 ms with `arch -x86_64` or the x86_64 launcher) points the same way.
Not confirmed by inspecting the running process (Chrome's user agent and `architecture` hints report the hardware, not translation).
Under the slow setup: page load 11-16 s, hover stalls of 340-580 ms, anchor precompute hitches up to 1.4 s, 30-50 fps. Re-measured in native arm64 Chrome (3 runs each):
page load 0.2-0.4 s, 120 fps, hover sweeps worst gap 18-30 ms with the OLD raycast, 11-38 ms with GPU picking, 11-32 ms
with the new UI. ADR 0003 chose GPU picking because of the emulated numbers.

## Decision
- All timing and fps work uses the arm64 node (`file $(which node)` must say arm64); numbers from x64 node are discarded.
- Keep GPU picking for now: it works, is tested, and costs nothing visible. It is not needed for speed. If the code is
  ever simplified, reverting to the raycast (commit 016cf41) is safe, at the price of 9 of 500 grid-point differences going away.
- Compute all 15 muscles' anchors once at load behind the loading overlay (about 15 ms native), not on idle frames.

## Consequences
- ADR 0003's performance reasoning (raycast stalls) does not hold natively; its mechanics description still does.
- The load-time worry (about 15 s) was an artifact. Real-world load on slower devices is still unmeasured.
- The loading overlay and picking warm-up are harmless but were motivated by the artifact.

## Alternatives rejected
- **Revert to raycasting now:** churn and risk on a working, tested path for no user-visible gain.
- **Keep trusting the old numbers:** they were wrong by about 10x.
