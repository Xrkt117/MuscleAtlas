# Facts verification, round 2 (re-check of the round-1 fixes)

Reviewer: independent Fable agent, not the author of the edits. Date: 2026-10-09.
Scope: only what the fix agent changed after round 1 (recommendations 1-9). Everything was
re-downloaded by me into `scratchpad/verify2/data/` (untrusted, never executed) and checked with
`python3 -I` scripts in `scratchpad/verify2/scripts/` that take file paths as arguments. No repo
file other than this report was written; no git state was changed; no npm command was run.

Fetches (HTTP status, bytes): Gray djvu.txt 200/4,736,024; free-exercise-db dist/exercises.json
200/1,005,327 (876 records); GitHub commits API 200/4,535; PMC8884877 200/190,402; PMC7969179
200/209,759; PMC10753835 200/180,884; efetch 27433992 200/1,780; efetch 27102172 200/2,742;
archive.org item metadata 200; eight archive.org per-page full-text queries 200.

Note on git: the working tree is clean and HEAD (`48eb319`) already contains the fixed files.
All seven facts commits and the round-1 report commit share the timestamp 2026-10-09 16:47:27,
so the fixes were applied before the facts were first committed; the committed round-1 report
describes a state that never existed in git. Not a problem, just worth knowing when reading it.

## Summary

| Check | Result |
|---|---|
| Evidence quotes verbatim | **8 / 8** found at the source URL (Baz-Valle x3, Schoenfeld 2017, Schoenfeld 2016, Maeo, Kinoshita x2). Longest 24 words. |
| Evidence text vs quote | **6 supported, 1 overreach, 1 defective**. Overreach: evidence[4] (Schoenfeld 2016) now drops the "volume-equated" condition that the old text had, a regression introduced by the fix. Defective: evidence[7] (soleus) says "In the same study ... the two legs" with no referent for a soleus-only reader. Minor: evidence[2] drops the authors' hedge "it appears that". |
| appliesTo | All ids are seed ids. evidence[0] (12-20 sets) covers exactly the 14 seeds other than `triceps_brachii`, consistent with evidence[2] (triceps: high > moderate). evidence[7] correctly targets `soleus` and its quote is about the soleus. |
| Muscle texts re-edited (triceps[1], serratus[0], trapezius[1]) | **3 / 3 supported**, all 42 Gray quotes still found verbatim (1 hit each). |
| Gray locators | **0 wrong.** 478 / 480 / 483 / 445 confirmed by two independent methods (OCR running heads and archive.org's per-page full-text index). |
| sources.json | Maeo licence string now equals the page text in full. free-exercise-db commit `79ca7b4` / 2026-08-29 confirmed by the commits API. |
| exercises.json | **38 / 38** links match id, name, primaryMuscles, secondaryMuscles exactly; locator = id; quote is a listed group; role correct per map for all 38. `Standing_Barbell_Calf_Raise` is a standing, knee-stationary calf raise with `calves` primary. Gastrocnemius list has no seated exercise; soleus keeps `Seated_Calf_Raise`. |
| New risks from the fixes | 1 regression (evidence[4]), 1 dangling reference (evidence[7]); nothing else. |

Counts: still-overreaching items **1** (plus 1 minor hedge drop), wrong locators **0**, dataset
mismatches **0**, licence mismatches **0**.

## 1. Evidence claims (all 8)

Exact substring match after whitespace collapse. "Adjacent clause" = words of the same sentence
immediately before or after the quote, counted as supported.

| # | Source / locator | Quote found | Text vs quote | appliesTo |
|---|---|---|---|---|
| 0 | baz-valle, Abstract | yes (2: abstract + body) | supported. "concluded" fits "According to the results of this review"; "muscle growth" = "muscle hypertrophy". | 14 ids = all seeds except triceps. Justified: the quote says "per muscle group" generally and the same abstract's only exception is the triceps (p = 0.01). Caveat for the tutor: the abstract reports data for only three muscles (quadriceps, biceps brachii, triceps brachii); the extension to chest, back, glutes etc. is the authors' own generalisation, not measured. |
| 1 | baz-valle, Abstract | yes | supported. "no significant difference" renders "no differences ... (p = 0.19) ... (p = 0.59)" conservatively. The 12-20 / >20 definitions are no longer in the text (omission, not addition); a reader does not learn what "moderate" and "high" mean. | quadriceps, biceps_brachii: matches the quote. |
| 2 | baz-valle, Abstract | yes | supported, **minor**: the sentence begins "However, it appears that"; the text says "found that ... was better", which drops the hedge. | triceps_brachii: matches. |
| 3 | schoenfeld-2017, Abstract (PubMed record) | yes | supported. "RT" is expanded as "resistance training (RT)" earlier in the same abstract. "meta-regression of 15 studies" removed as recommended. | all: the quote is not muscle-specific. |
| 4 | schoenfeld-2016, Abstract, CONCLUSIONS | yes | **overreaches (regression).** The sentence is "When comparing studies that investigated training muscle groups between 1 to 3 days per week on a volume-equated basis, the current body of evidence indicates that frequencies of training twice a week promote superior hypertrophic outcomes to once a week." Round 1 recorded that the old text carried "volume-equated"; the fix removed it together with "across ten studies". Without it the claim reads as "train twice a week" rather than "the same weekly volume split over two days beats one day", which is what the abstract supports. | all: the quote is not muscle-specific. |
| 5 | maeo, Abstract, Conclusion | yes | supported. "(lying)" is a gloss of "prone" needed to connect to the dataset's Lying Leg Curls. "Single study" label kept. | three hamstrings: the quote says "Hamstrings muscle size" (group). Fine as a group claim; the tutor must not say "each head" (the abstract's monoarticular result, i.e. biceps femoris short head, is not in this claim). |
| 6 | kinoshita, Abstract, Conclusion | yes | supported, including "recommended" ("therefore recommended" is in the quote). | gastrocnemius: matches. |
| 7 | kinoshita, Abstract, Results | yes ("Results :" label exists in the abstract) | **defective, not overreaching.** "In the same study" has no referent: a soleus query returns this claim but not evidence[6] (appliesTo gastrocnemius), so "same study" and "the two legs" are unexplained. The sentence the quote comes from names the conditions ("significantly greater for the standing than seated condition leg in the lateral gastrocnemius ..., but similar between legs in the soleus"), so "standing vs seated" is adjacent-clause and may be used. | soleus: the quote is explicitly about the soleus. Correct. |

## 2. Re-edited muscle texts

| Entry | Text | Quote | Verdict |
|---|---|---|---|
| triceps_brachii[0] | "The main muscle that straightens the elbow; it directly opposes the biceps and brachialis." | "...the great extensor muscle of the forearm, and is the direct antagonist of the Biceps brachii and Brachialis." | supported |
| triceps_brachii[1] | "With the arm extended, its long head can help the teres major and latissimus dorsi draw the upper arm backward." | "When the arm is extended, the long head of the muscle may assist the Teres major and Latissimus dorsi in drawing the humerus backward" | supported; the condition is now kept, "can help" = "may assist" |
| serratus_anterior[0] | "Pulls the shoulder blade forward and raises its inner (spine-side) border." | "...carries the scapula forward, and at the same time raises the vertebral border of the bone." | supported; "around the chest" removed |
| trapezius[1] | "...raises the point of the shoulder, as when supporting weights." | "...elevate the point of the shoulder, as in supporting weights" | supported |

All 42 Gray quotes: found exactly once each; none longer than 24 words.

## 3. Gray page locators

Two methods. (a) OCR running heads in the djvu.txt (character distance from the quote to the
nearest head on each side). (b) archive.org's per-page full-text index (`fulltext/inside.php`),
which returns a page number per hit; calibrated on page 443: the text just after the "ARM 443"
head and the footnote just before the "444 MYOLOGY" head both come back as 443, so the index's
page numbers are the printed page numbers.

| Locator | Claims | (a) OCR heads | (b) IA index | Verdict |
|---|---|---|---|---|
| p. 478 gluteus_maximus [0..2] | 3 | 884-1,551 chars after "478 MYOLOGY", 1,493-2,160 before "FEMORAL MUSCLES 479" | 478 | correct |
| p. 480 hamstrings (3 ids x 3) | 9 | 4,410 chars after "...479"; the OCR head reads "480 ^^^SSBKI^ MYOLOGY" 307 chars before the Actions paragraph; "...481" 3,591-3,919 after | 480 | correct |
| p. 483 gastrocnemius / soleus [0..2] | 6 | 2,824-3,344 chars after "CRURAL MUSCLES 483", 747-1,267 before "484 MYOLOGY" | 483 | correct |
| p. 445 triceps_brachii [0..1] | 2 | OCR has no 445 or 446 head at all (only "444 ^^MAMJa^^ MYOLOGY" and "...447"). The quote is 6,361 chars after the 444 head; pages here average 4,240 chars, and the "Antibrachial Fascia" heading (TOC: 445) follows 505 chars after the quote. | 445 | correct. Confidence: high. Method (a) alone would be "very probably 445" because the head is missing; method (b) is independent of the running heads and gives 445 directly, and agrees with the TOC entry for the heading that follows. I did not open page images. |

Also re-confirmed unchanged: biceps_brachii p. 444 (IA index 444).

## 4. sources.json

| Item | Page prints | Stored | Verdict |
|---|---|---|---|
| maeo licence | "This is an open-access article distributed under the terms of the Creative Commons Attribution-Non Commercial-No Derivatives License 4.0 (CCBY-NC-ND), where it is permissible to download and share the work provided it is properly cited. The work cannot be changed in any way or used commercially without permission from the journal." | identical | matches in full (the only difference in my stripped HTML is a space before the comma left by the closing `</a>` tag; the raw HTML has no space) |
| free-exercise-db | commits API for `dist/exercises.json`, `per_page=1`: sha `79ca7b47d77cd5a6dd7a50440e9f0bf24da6a142`, author and committer date 2026-08-29T08:33:33Z, "feat: add Kettlebell halo and overhead extension exercises (#28)" | "latest commit touching it: 79ca7b4 (2026-08-29)" | matches. `year: 2026` is now consistent with the recorded commit date. The API defaults to the default branch, which matches "at main". |
| kinoshita, baz-valle | unchanged | unchanged | still verbatim on the page |

## 5. exercises.json (all 38 links re-checked against the fresh dataset)

876 records, 17 group names, map has exactly those 17. All 38 links: id exists; `name`,
`datasetPrimary`, `datasetSecondary` equal the record (order included); `cite.locator == id`;
`cite.quote` is a group in the record; `role: primary` is right for all 38 (muscle id is mapped
from a group in `primaryMuscles`). 0 mismatches.

`Standing_Barbell_Calf_Raise` (the replacement): name "Standing Barbell Calf Raise",
primaryMuscles ["calves"], secondaryMuscles [], equipment barbell, mechanic isolation. Its own
instructions: bar on the back of the shoulders, "The knees should be kept with a slight bend;
never locked", "Ensure that the knee is kept stationary at all times. There should be no bending
at any time." So: standing, knee held near-straight and fixed, calves primary. It is the standing
condition in the sense of Kinoshita (standing/knee-extended), though the dataset says "slight
bend" rather than fully extended; that is a cue difference, not a seated/flexed-knee exercise.

Gastrocnemius list: `Standing_Calf_Raises`, `Standing_Barbell_Calf_Raise`; no seated entry.
Soleus list: `Standing_Calf_Raises`, `Seated_Calf_Raise`. The seated trap is gone for the
gastrocnemius and the soleus keeps its seated exercise, as recommended.

Two things to keep in mind, neither an error: the dataset itself still lists `Seated_Calf_Raise`
(and `Barbell_Seated_Calf_Raise`, `Dumbbell_Seated_One-Leg_Calf_Raise`) as `calves` exercises,
and the map still sends `calves` to both ids, so the omission is a curation choice the tutor
should not describe as "the dataset has no seated calf raise for the gastrocnemius". And the
smaller analogous trap from round 1 is unchanged: `Lying_Leg_Curls` stays a primary exercise for
all three hamstrings while evidence[5] says seated > prone.

## 6. Newly wrong or risky

1. **evidence[4] regression**: "on a volume-equated basis" was lost when "across ten studies" was
   removed. This is the same class of error as the triceps long-head one fixed in round 1 (a
   condition dropped from the quote's own sentence).
2. **evidence[7] dangling reference**: "In the same study" and "the two legs" are only
   intelligible next to evidence[6], which a soleus query does not return (`getFacts` filters by
   `appliesTo`).
3. `index.test.ts` "'all' evidence appears for every muscle" still holds only because evidence[3]
   and [4] remain `"all"`; if either is ever narrowed the test name becomes misleading. Not an
   error now.
4. Nothing else: no new quote, locator, dataset or licence problems were introduced.

## Recommended edits (not applied)

| Entry | Action | Reason |
|---|---|---|
| evidence[4] `text` | "The Schoenfeld review's abstract concludes that, with weekly volume equated, training a muscle group twice a week promotes superior hypertrophic outcomes to once a week. Read from the PubMed abstract only." | restores the condition from the quote's own sentence ("on a volume-equated basis") that the fix dropped |
| evidence[7] `text` | "In the Kinoshita standing-versus-seated calf-raise study, soleus growth was similar between the standing and seated legs (2.1% vs. 2.9%, p = 0.410). Single study." | "same study" has no referent for a soleus-only reader; "standing than seated condition leg" is in the quoted sentence, so it is supported |
| evidence[2] `text` | optional: "found that a high training volume appears to be better for muscle mass gains in the triceps brachii (p = 0.01)" | keeps the authors' hedge "it appears that" from the adjacent clause |
| evidence[0] | optional: no text change; have the tutor prompt note that the review's measured muscles were quadriceps, biceps brachii and triceps brachii | appliesTo is justified by the quote's wording, but the data behind it are three muscles |

## What I could not verify

- `npm test` / `tsc` were not run (forbidden for this review); the 14 `appliesTo` ids were
  checked against `src/muscle-map.ts` by script instead, all valid.
- Page images of Gray were not opened; the page numbers rest on the OCR heads plus archive.org's
  per-page index, which agree with each other and with the TOC.
- Site-wide terms (archive.org, GitHub, publishers, NLM) were not read, as in round 1.
- Whether `Standing_Barbell_Calf_Raise` is "knee-extended" in Kinoshita's exact sense cannot be
  settled from the dataset text, which says "slight bend; never locked".
