# UI review: info panel, callouts, list rail (3efe15f..e14bc43)

Reviewer: independent (Fable-style read-only review). Date: 2026-10-09.

## Summary

| Severity | Count |
|---|---|
| Blocker | 0 |
| Should-fix | 10 |
| Nit | 13 |

**Verified by running:** `npm run typecheck` is clean. `npm test` gives 9 files and 82 passed, 0 failed. `npm run build` succeeds (633 kB chunk warning, which comes from three.js and was already there). Locator-to-short-cite parsing was checked for every locator in `muscles.json` and `evidence.json` with a node one-liner: every Gray locator gives `p. N` and every paper locator gives `abstract`. The three.js r170 `WebGLAnimation.onAnimationFrame` was read in `node_modules`: it calls the loop and only then requests the next frame, so a throw in the loop stops rendering for good.

**Not verified (no browser was run):** real callout placement, the actual contrast over real model pixels (the numbers below are computed from the CSS), whether Chrome fires `blur` when a focused button becomes `display:none`, screen-reader output, and the narrow and mobile layouts.

The data-honesty basics hold. Every rendered claim carries a short cite plus a details block with the full cite and licence. `panel.ts` uses `textContent` only, and `src/` has no `innerHTML`. Badges come from explicit `caveat` fields. General findings sit under their own h4. No exercises are shown. The footer has both credit lines, and it stays on top of the info panel in the narrow layout because it comes later in the DOM at the same z-index.

---

## Should-fix

### S1. A stale callout set can throw inside the render loop and stop rendering for good
`src/callouts.ts:70,79` index `f.parts[i]` by the number of chips from the last `show()`. `src/viewer.ts:247` calls listeners inside `setAnimationLoop` (`viewer.ts:261`), with no guard.

**Why it matters.** `main.ts` keeps `highlight()` and `callouts.show()` in step, but `window.atlas` is public (`main.ts:26`), and STATE says the Phase 4 tutor will drive it. Two ways it goes wrong:
- `atlas.highlight(["soleus"])` while the deltoid (3 parts) is shown makes `f.parts[1]` undefined. That throws a TypeError, three.js never requests the next frame, and the canvas freezes.
- `atlas.clear()` leaves chips frozen on screen pointing at nothing, because `update(null)` returns early (`callouts.ts:64`) and nothing calls `show(null)`.

**Fix.** Add the selected id to `FrameInfo`. Have `callouts.update` rebuild when `f.id !== shownId` and hide on `null`. That also removes the need for `main.ts:66` to call `show`. At minimum, add `if (!f || f.parts.length !== items.length) { hide; return; }`. Separately, wrap `frameListeners.forEach` in try/catch so one bad listener cannot kill the loop.

### S2. Chip sizes are measured once and are 0x0 if the selection happened under 600 px wide
`src/callouts.ts:61` measures `offsetWidth` and `offsetHeight` once, in `show()`. `src/style.css:81` sets `.callouts { display:none }` under 600 px, so a chip measured there is 0 x 0. Nothing measures it again: the ResizeObserver only watches the stage and the panels (`callouts.ts:30-32`).

**Why it matters.** Select a muscle on a phone in portrait, then rotate to landscape (about 844 px): callouts turn on with w=h=0. A left label is placed at `obstacle.x - 16 - 0`, so the real 150 px chip is drawn over the figure, and the overlap checks never hide it. `.claude/rules/viewer.md` claims label sizes are "cached (ResizeObserver)", which is not what the code does.

**Fix.** Measure the chip sizes again inside `readAvoid` (it already runs on stage resize), or `ro.observe(chip)` each chip in `show()`.

### S3. Keyboard focus is lost on the first selection from the list
`src/main.ts:69` collapses the rail from `open` without moving focus. The button that has focus becomes `display:none` (`style.css:46`), so focus falls back to `<body>`. The overlay path does refocus the pill (`main.ts:44`), but this one does not. In the narrow layout the pill is `display:none !important` (`style.css:88`), so `closeOverlay(true)`'s `pill.focus()` fails there as well.

**Why it matters.** A keyboard user's first selection with Enter drops them at the start of the document.

**Fix.** Route the open-to-collapsed transition through `closeOverlay(true)`, so the pill gets focus. In `closeOverlay`, fall back to the pressed list button when the pill is not rendered (`pill.offsetParent === null`).

### S4. Opening the pill on focus forces a 400 ms timing hack and breaks Enter
`src/main.ts:35,47-51`: `suppressFocusOpen`, `focusOpenedAt` and the `> 400` ms window exist only because focus opens the overlay.

**Why it matters.** A keyboard user who Tabs onto the pill gets the card opened on focus. If they press Enter more than 400 ms later, expecting to open it, it closes instead. The behaviour depends on time, it is surprising (it goes against the spirit of WCAG 3.2.1, On Focus), and it is the most complex code in `main.ts`.

**Fix.** Drop the focus-to-open behaviour. Let click, Enter, Space and M toggle the card. That deletes the two flags, the focus listener and the timing check, about 5 lines. Update ADR 0005 and the rule line in `viewer.md` to match.

### S5. Muted text over the translucent glass can fall to about 3.2:1, including the footer credits and citations
`src/style.css:2-3` (`--muted #9aa0a8`, `--glass rgba(18,20,24,.72)`), used at `:62-63,72`.

**Why it matters.** Over the bone colour (`#e8e0cc`), the composite background is about rgb(78,77,74), which gives about 3.2:1 for 12-12.5 px text (computed, not measured). That is below WCAG AA's 4.5:1. The affected text is the short citations, the licence lines and the footer credit, which the licence requires to stay legible. Over pure black it is about 7:1.

**Fix.** Raise the glass alpha to about `.85` (computed at about 4.8:1 worst case), or lighten `--muted` to about `#b4b9c0`. The rest of the design is unchanged.

### S6. Labels at opacity 0 still take up room and can hide visible labels
`src/callouts.ts:69-81` passes every part to `layoutCallouts`. `src/callout-layout.ts:66-71` pushes every non-hidden label into `kept` and into the vertical relaxation, whatever its facing visibility.

**Why it matters.** A part facing away (`visibility 0`) is invisible but still pushes neighbours down. Through `kept.some(hit)`, it can mark a visible later label as hidden. The result is labels disappearing for no reason the user can see.

**Fix.** Pass `hidden: f.parts[i].visibility === 0` (or add a `visible` flag on the anchor) into `layoutCallouts`, and OR it into the initial `hidden` at `callout-layout.ts:34`. Add one property test for it.

### S7. The panel shows the verbatim quote for actions but never for evidence
`src/facts/panel-model.ts:7,19-26` drops `cite.quote` for evidence. `src/panel.ts:14-20` therefore has no blockquote for evidence items.

**Why it matters.** Evidence claims are paraphrases ("by far more effective ... and recommended them"). The quote that lets a reader check a paraphrase is shown for anatomy but hidden for the training claims. Those are the riskier claims, and the tutor will lean on them.

**Fix.** Add `quote` to `PanelEvidence`. Render `h("blockquote", null, e.quote)` inside the existing details, and rename its summary to `"<short>, original wording"`, as for actions.

### S8. On load failure the panels cover the error banner, and an empty glass panel appears
- `src/style.css:12`: `#stage` is `position:fixed`, so it forms its own stacking context, and `#error`'s `z-index:6` (`:22`) only applies inside it.
- `#rail`, `#info`, `#brand` and `#credits` (z 3, `:28`) are painted above it once `main.ts:114` removes `body.loading`.
- `renderPanel` is never called on the error path, so `#info` is a large empty 400 px glass box.

**Why it matters.** The one message that explains a broken page is partly covered by the brand and the info panel.

**Fix.** In `catch`, add `document.body.classList.add("failed")`. Hide `#rail` and `#info` under `body.failed` in CSS, and keep `#credits`. Alternatively, move `#error` out of `#stage` with z-index 6.

### S9. Docs that the next session will trust are now wrong
- `.claude/STATE.md` (included by CLAUDE.md) still says the UI is "BUILT BUT UNCOMMITTED", lists the anchor hitch as a BLOCKER, and gives "Load time about 15 s". All of that was done in 20dc97f and 0e6eba2, and ADR 0006 shows the load time was a Rosetta artifact.
- `src/viewer.ts:141` ("a raycast ... stalled frames for 50-600 ms") and `:255-257` ("first partial picks cost 60-250 ms") repeat numbers from emulated Chrome that ADR 0006 discards.

**Fix.** Run `checkpoint` to rewrite STATE. Reword the two comments to "measured under Rosetta, see ADR 0006", or remove the numbers.

### S10. A hamstrings group finding is shown as muscle-specific evidence
`src/facts/evidence.json` (the Maeo claim: `appliesTo` the three hamstrings, no `general`), rendered under "Training evidence" by `src/panel.ts:39`.

**Why it matters.** `.claude/rules/facts.md` says "do not claim finer than the source: ... hamstrings have group statements". The action claims for the same muscles explicitly say "Group statement". This evidence item sits in the muscle-specific list on biceps femoris, semitendinosus and semimembranosus without that label. The text does say "hamstrings", so this is a small labelling problem, not a false claim.

**Fix.** Either add a third caveat or badge, `"group"` shown as "Hamstrings as a group" (and update the `facts.test.ts` caveat rule), or append "(hamstrings as a group, not this muscle alone)" to the text. Do not mark it `general`: it is not general across all muscles.

---

## Nits

- **N1. `src/main.ts:29` / `src/callouts.ts:27`: the avoid rects for `listCard` and `pill` are wrong and redundant.** Their `offsetParent` is the fixed `#rail`, so `offsetLeft` and `offsetTop` are relative to the rail, which places phantom rects near (0,0). `#rail` already covers both. Delete them from `avoidEls`, which simplifies the code and makes it correct.
- **N2. `src/main.ts:29`: `#brand` (the h1) is not an avoid rect.** Chips can slide under it (it is on z 3). Add it to the list, or accept the overlap.
- **N3. `src/main.ts:58-71`: re-selecting the selected muscle restarts the 600 ms focus animation and makes the callouts blink.** The aria-live text is unchanged, so nothing is re-announced, and deselecting is never announced. Early-return when `id` is already selected (still collapse the rail), and announce "Selection cleared".
- **N4. `src/main.ts:90-96`: the global `Escape` and `m` handlers ignore `e.target`, `e.repeat` and `defaultPrevented`.** Harmless today. The Phase 4 chat input would lose the letter "m" and deselect on Esc. Guard with `if ((e.target as HTMLElement).closest("input,textarea,[contenteditable]")) return;`.
- **N5. `index.html:11`: the pill's accessible name joins two spans with no separator.** It may be read as "MusclesBiceps brachii". Add `aria-label` updated in `select`, or put a visually hidden ", " between the spans.
- **N6. `src/callouts.ts:63-75` / `callout-layout.ts`: about 30-50 small allocations per frame (maps, filters, sorts, object literals) while a muscle is selected.** This work also runs while the layer is invisible: during the focus animation, and under 600 px where it is `display:none`. The cost is small. A cheap fix is to skip the layout when `f.animating` (the layer is off anyway). `viewer.md` forbids layout reads, not allocations, so this is not a rule violation.
- **N7. `src/viewer.ts:39`: `prefers-reduced-motion` is read once, at module load.** Changing the OS setting needs a reload. A `matchMedia(...).matches` check inside `focus()` is one line.
- **N8. `src/viewer.ts:210-216` and `callouts.ts:64`: the `null` frame is emitted, but its only consumer ignores it.** Either use it (it is the natural fix for S1's `clear()` case) or drop `emitNull`.
- **N9. `src/main.ts:69,81-82`: possible stuck preview hover (unverified).** After an Enter selection, the focused list button is hidden. If Chrome does not fire `blur` on it, `hovered` stays set, and after Esc that muscle is painted yellow until the pointer moves over the canvas. Calling `atlas.preview(null)` in `select()` removes the question entirely.
- **N10. `src/panel.ts:12`: the full citation shows no URL or DOI, although `sources.json` has them.** A link (`h("a", {href: s.url, rel: "noopener"})`, with a URL from the repo's own data) makes each cite checkable in one click.
- **N11. `src/anchors.test.ts:125`: a 250 ms wall-clock assertion.** It will flake on a slow or emulated CI runner (the ADR 0006 lesson). Assert the stride and sample count instead, or loosen it to a coarse bound.
- **N12. Narrow layout: M puts the rail into an `overlay` state that looks the same as `collapsed`.** So Esc first "closes" an invisible state and only the second Esc deselects (`main.ts:92`). Ignore M and overlay when the pill is not rendered.
- **N13. Landmarks: the main content (the panel) is an `<aside>`, and `<main>` holds only the canvas.** Consider `<section id="info">`, or making the panel the `main` landmark. This is low priority.

---

## The 3 most valuable missing tests

The project has no DOM environment yet. Tests 1 and 2 need `happy-dom` as a dev dependency (one line in `vitest` via `// @vitest-environment happy-dom`). Alternatively, the logic can first be extracted into pure functions.

1. **`panel.ts` renders honestly, checked on the DOM rather than on the model.** For every muscle:
   - every `.claim` has a `.cite` short line and a `details` block holding the full cite and a `Licence:` line;
   - badges appear exactly when the model has them;
   - general items come after the "General findings" h4;
   - no element text is a raw id;
   - after S7, every evidence item has a blockquote.

   `panel-model.test.ts` covers the model; nothing covers the surface the owner actually sees.
2. **The callout lifecycle stays in step with the selection.** `show("deltoid")`, then `update()` with a FrameInfo of 1 part, must not throw (S1). `update(null)` after `clear()` hides the chips. `show()` while the layer is `display:none`, followed by a resize, re-measures the chip sizes (S2). A part at visibility 0 does not hide a visible part (S6, testable in `callout-layout.test.ts` without a DOM).
3. **The rail keyboard flow.**
   - Selecting from the open card leaves focus on the pill (S3).
   - Tab to the pill, then Enter, leaves the card open (S4).
   - Esc with the card open closes it without deselecting; a second Esc deselects.
   - M opens the card and focuses the pressed button.
   - A pointerdown outside the rail collapses it.

   This is the code with the most bugs found in this review, and none of it is tested.

(A runner-up is the side choice with 0.85 hysteresis in `emitFrame`, `viewer.ts:219-224`. It is untestable where it lives; extracting `pickSide(d0, d1, prev, animating, sx0, sx1)` would make it a 6-line pure test.)
