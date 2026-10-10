# Merge review: spertia commits 9c52c7b..9e3d5b0

Reviewed range: `7374b12..9e3d5b0` (9c52c7b, 4ee3559, 6234e89, 5ee3d8b, 9e3d5b0). Date: 2026-10-09.
Changes made by this review are limited to `src/facts/muscles.json` and `src/facts/exercises.json`. `exercises.json` was only re-indented: the merge had broken the `json.dumps(indent=2)` layout, and the data is semantically identical to HEAD (checked with Python).

## Method
- Gray quotes: exact substring of the archive.org OCR text (`anatomyofhumanbo00grayrich_djvu.txt`, same file as the earlier verification, compared byte for byte), with whitespace collapsed only. Page numbers come from the OCR running heads on either side of each quote.
- Evidence quotes: the same `check_quotes.py` run against the source files downloaded for the earlier verification. `evidence.json` is unchanged in this range.
- Dataset: `dist/exercises.json` downloaded fresh (HTTP 200, 1,005,327 bytes, 876 records, 17 group names). Every link was checked for id, name, primary, secondary, role per map, locator and quote.

## 1. Quote verification
Before: 50 of 56 quotes verbatim (48 muscle + 8 evidence). The 6 misses are all in the new groups (forearm_muscles[0-2], hip_adductors[0-2]). After: **56 / 56 verbatim**, all 48 Gray quotes match exactly with no normalisation, and the longest quote is 24 words.

## 2. Replaced quotes
| Claim | Before (not in Gray) | After (verbatim, locator) |
|---|---|---|
| forearm[0] | "Acting with the flexor carpi ulnaris, the flexor carpi radialis flexes the wrist" | "The Flexor carpi radialis is a flexor and abductor of the wrist; it also assists in pronating the hand, and in bending the elbow." V. Forearm, 1. Volar Antibrachial Muscles, Actions (p. 450) |
| forearm[1] | "The Extensor digitorum extends the phalanges and then the wrist." | "The Extensor digitorum communis extends the phalanges, then the wrist, and finally the elbow." 2. Dorsal Antibrachial Muscles, Actions (p. 456) |
| forearm[2] | "The Pronator quadratus pronates the forearm, i.e. turns it so that the palm ... backwards." | "The Pronator quadratus rotates the radius upon the ulna, rendering the hand prone." 1. Volar Antibrachial Muscles, Actions (p. 451) |
| adductors[0] | "The Pectineus and the adductores adduct the thigh powerfully" | "The Pectineus and three Adductores adduct the thigh powerfully" 2. Medial Femoral Muscles, Actions (p. 474), group statement |
| adductors[1] | "... they draw it medially, ..." | "when the limb has been abducted, they draw it medialward, carrying the thigh across that of the opposite side" (p. 474), group statement |
| adductors[2] | "In progression, they assist in drawing forwards the lower limb." | "In progression, all these muscles assist in drawing forward the lower" (p. 474), group statement. The quote stops before "limb", which the OCR garbles as "hmb"; the gluteus_maximus[2] precedent does the same. |

- Each `text` was rewritten so it says no more than its quote.
- The forearm locators say "X only, one muscle of this group".
- The adductor locators say they are group statements. adductors[0] also notes that the sentence leaves out the Gracilis.
- The old forearm[0] text ("The forearm flexors bend the wrist") was a group claim that its quote did not support, so it is gone.

## 3. Changed claims in rectus_abdominis
- [0]: unchanged and verified.
- [1]: the merge dropped Gray's literal wording. I restored "(flexes the pelvis on the vertebral column)", which the earlier verification had required next to the gloss.
- [2]: the merge removed "Group statement." from the text and shortened the locator to "abdominal group statement". I restored the reviewed locator ("group statement, for the antero-lateral abdominal muscles together") and the "Group statement." label. The new text wording is supported.

## 4. Dataset links and mapping
- **42 / 42 links match**, with 0 mismatches. The 4 new links (2 forearm wrist curls, Thigh_Adductor, Lateral_Bound) are exact and their roles are correct.
- Mapping `forearms -> forearm_muscles` and `adductors -> hip_adductors` is correct: the dataset groups and the new muscle groups match.

Judgement calls, not changed:
- **Lateral_Bound** as a "primary" adductor exercise. The dataset does list adductors as primary, but it is a plyometric lateral push-off. Thigh_Adductor, Band_Hip_Adductions or Adductor would be clearer picks.
- The **dataset map `note` was weakened**. It no longer says that a row "is not evidence about any single muscle or head", or that each justification rests on the group name only. Consider restoring the old note.
- The `glutes` and `shoulders` "why" texts no longer mention the untracked medius/minimus and rotator cuff muscles.

## 5. Test diff (src/muscles.test.ts)
The test count is unchanged (13 in the file), but the whole `describe("parts")` block (4 tests) was **removed**:
- the `partLabel` cases;
- "every muscle has parts; multi-node muscles one per node", including the count of multi-node muscles. That count would now be 10; it was 8;
- "names the parenthesised pectoralis part";
- "partsFor throws on unknown id".

`partsFor` and `partLabel` still exist and drive `viewer.ts` anchors and `callouts.ts` chips, so they now have no tests. The fix is to restore the block with the count set to 10. The other changes are additions, reformatting or updated counts (15 -> 17 muscles, 58 -> 126 nodes, back count still 9).

## 6. UI (native Chrome, 1440x900, ARM64 node for Playwright)
Vite had to run under the x86_64 node, because `node_modules` has only the x64 rolldown binding. Console errors: 0.

| Selection | Chips | Overlaps |
|---|---|---|
| Pectoralis major | 3 / 3 visible | none |
| Forearms | 22 of 24 visible | none between chips or with panels (geometry check) |
| Hip adductors | 6 / 6 | none |
| Abdominals | 5 / 5 | none |

- **Forearms looks cluttered.** The 22 chips stack in one full-height column with about 22 long, crossing leader lines into one forearm. The flexor digitorum profundus and flexor pollicis longus chips are hidden. The owner should consider capping the chips or grouping them by layer.
- **The rail does not fit at 1440x900.** The card runs to y=867 when open on load and y=907 as an overlay, which is under the credits footer and past the window. The hint "Esc or click empty space to deselect" is clipped. The "Hip adductors (inner thigh)" label wraps to two lines in the list and is truncated in the pill ("Hip adductors (inne...").
- The id `rectus_abdominis` now shows as "Abdominals" and covers the obliques, transversus and pyramidalis. Its claims [0] and [1] are about the Recti only, and their text says so. The id name is misleading for the tutor.

## Validation (after edits)
- typecheck: 0 errors.
- npm test: 90 passed, 0 failed (10 files).
- build: OK, with the existing chunk-size warning.
