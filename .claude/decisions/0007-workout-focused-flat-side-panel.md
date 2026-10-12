# 0007 — Workout-focused UI: flat right-hand side panel with two tabs

**Date:** 2026-10-11
**Status:** accepted (supersedes the layout in 0005 and the earlier "no exercises in the panel" choice)

## Context
The app answered "what does this muscle do" but the owner wanted it workout-focused: select a muscle, see which exercises
train it. The owner also wanted a minimalist, flat look that does not read as AI-generated, a callout per muscle part, and
hover on individual parts. After several mockup rounds the owner chose a two-tab right-hand panel. `origin/main` meanwhile gained
a Mixer, an AI chat, section colours and view controls, which the redesign had to keep.

## Decision
- Selecting a muscle opens `#side` on the right: tab "Exercises" (one list; the open row shows Primary/Secondary dataset groups,
  mechanic and kind, the quote) and tab "Anatomy and evidence" (actions, programming, evidence). Header = muscle name.
- The muscle list on the left is always visible. Muscle building and Mixer are quiet sections under it.
- Flat style everywhere, including chat, view controls and Sources: no blur, shadow, gradient, glow or pill badges.
- Callouts: one label per visible part with a swatch in the part's section colour, leader line and dot.
- Part picking: each part node has its own id colour in the same single 1x1 GPU pick (see 0003); hover paints one part amber.
- Exercise copy stays "Listed as in the dataset": a listing, not a ranking.

## Consequences
- The side panel hides while the AI chat is open and while the Mixer holds muscles.
- No exercise images: real photos have an unresolved licence; a model-view image was built and removed at the owner's request.
- The glass floating panels and the collapsing list rail from 0005 are gone.

## Alternatives rejected
- Exercise cards inside the old floating panel: the owner wanted exercises on the right and the list left, not a stacked card.
- Bottom exercise shelf, accordion-led layout: judged less clear than two tabs in mockups.
- Real exercise photos (free-exercise-db): licence unresolved (upstream issue #13), and the owner did not want real people.
- One callout with one leader line: it hid which part was which.
