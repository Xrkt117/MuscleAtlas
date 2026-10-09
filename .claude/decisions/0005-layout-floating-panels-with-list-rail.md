# 0005 — UI layout: floating panels over a full canvas, list collapses to a pill

**Date:** 2026-10-09
**Status:** accepted

## Context
The owner wanted a spacious UI with a lot of cited information and callouts pointing at muscle parts in 3D. They
compared two real mockups (screenshots read) before choosing.

## Decision
The canvas fills the window. A translucent list card floats left, a translucent info panel floats right
(What it does + Training evidence, cited), and callout chips with leader lines point at named parts. The list is open
on first load, then collapses to a pill showing the current muscle after the first selection (click, focus or M
reopens it), so callout labels get free space beside the figure. Footer credits stay visible.

## Consequences
- The figure sits about 80 px off the free-area centre; the glass blur may cost fps on weaker GPUs (`--glass-blur: 0px` is the escape hatch).
- Callouts are hidden under 600 px width; below 900 px the list becomes a chip row and the panel a bottom sheet.
- Callout anchors are surface points near a part, not anatomical landmarks.

## Alternatives rejected
- **Wide stage + right drawer (layout B):** tidier labels, but a solid drawer crops the figure and feels less open.
- **Origin/insertion callouts:** need hand-placed bone anchors for every muscle; deferred.
