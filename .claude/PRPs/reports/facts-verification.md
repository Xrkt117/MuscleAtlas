# Facts verification (task 8, independent re-check)

Reviewer: separate Fable agent, not the author. Date: 2026-10-09.
Method: every source URL in `src/facts/sources.json` was re-downloaded with curl into a fresh
directory (`scratchpad/verify/data/`, untrusted, never executed) and checked with small
`python3 -I` scripts in `scratchpad/verify/scripts/` that take the file paths as arguments.
Nothing from the author's downloads or scripts was reused. No repo file other than this report
was changed.

Fetches (HTTP status, bytes): Gray djvu.txt 200/4,736,024; free-exercise-db dist/exercises.json
200/1,005,327 (876 records); PMC8884877 (Baz-Valle) 200/190,402; PMC7969179 (Maeo) 200/209,759;
PMC10753835 (Kinoshita) 200/180,884; efetch 27433992 200/1,780; efetch 27102172 200/2,742;
GitHub repo page 200; raw README.md 200; raw LICENSE.md 200; archive.org `_meta.xml` and
details page 200; Wikimedia Commons file page 200; PMC copyright policy page 200.

## Summary

| Check | Result |
|---|---|
| Quotes found verbatim | **48 / 48** (42 muscle + 6 evidence; 36 distinct strings). Exact substring after whitespace collapse; no case, hyphen or OCR fallback was needed. **0** depend on an OCR error. Longest quote 24 words (limit 25). |
| Paraphrases | **41 supported**, **7 overreach** (1 muscle claim, 6 evidence claims; see table). Of the 7, 5 are "the quote is too short for the text, but the cited abstract backs it"; 2 contain wording the source does not support. |
| Locators | All 10 Gray section headings exist. **Page numbers wrong for 18 claims** in 3 groups (gluteus 477 -> actually 478; hamstrings 479 -> 480; calf 482 -> 483). 24 Gray page numbers correct. All 6 evidence locators exist. Checked: all 48. |
| Dataset (38 links) | **38 / 38 match** id, name, primaryMuscles, secondaryMuscles exactly; **38 / 38 roles** correct per map; cite.locator == id and cite.quote is a listed group for all 38. **0 mismatches.** |
| Muscle map | 17 dataset group names, all 17 in the map, none extra. **0 wrong mappings.** 1 misleading consequence (Seated Calf Raise as "primary" gastrocnemius vs evidence[5]). |
| Licences | **0 contradictions** between stored string and page. 1 incomplete (Maeo: stored string omits the sentence that states the actual restriction). 1 unverifiable (free-exercise-db `year: 2026`). No AI-use clause found on any page read; site-wide terms (archive.org, GitHub, publisher sites) were **not** read. |

## 1. Quote check (verbatim)

Source for Gray: the archive.org OCR text at the URL in sources.json. The quotes were matched
after collapsing whitespace only. Positions are character offsets in the normalised text
(for reproducibility).

| Entry | Found | n | Notes |
|---|---|---|---|
| pectoralis_major[0] | yes | 1 | preceding words "If acting alone," are outside the quote |
| pectoralis_major[1] | yes | 1 | subject "the Pectoralis major will," is outside the quote; the OCR has it as "Pectorahs major", which is presumably why it was cut |
| deltoid[0] [1] [2] | yes | 1 each | |
| latissimus_dorsi[0] [1] | yes | 1 each | [1]: the sentence continues "or jn [sic] sabre practice" |
| latissimus_dorsi[2] | yes | 1 | sentence continues ", as in cUmbing" (OCR for "climbing") |
| trapezius[0] [1] [2] | yes | 1 each | |
| serratus_anterior[0] [1] [2] | yes | 1 each | |
| biceps_brachii[0] [1] | yes | 1 each | |
| triceps_brachii[0] [1] | yes | 1 each | [1]: sentence continues "and in adducting it to the thorax" |
| rectus_abdominis[0] [1] [2] | yes | 1 each | |
| gluteus_maximus[0] [1] [2] | yes | 1 each | [2]: sentence continues "of the hmb" (OCR for "limb") |
| quadriceps_femoris[0] [1] [2] | yes | 1 each | |
| biceps_femoris[0] [1] [2] | yes | 1 each | [0] and [2] are the group sentences shared with the next two muscles |
| semitendinosus[0] [1] [2] | yes | 1 each | |
| semimembranosus[0] [1] [2] | yes | 1 each | |
| gastrocnemius[0] [1] [2] | yes | 1 each | [0] and [1] shared with soleus |
| soleus[0] [1] [2] | yes | 1 each | |
| evidence[0] baz-valle | yes | 2 | appears in the abstract and again in the body |
| evidence[1] baz-valle | yes | 1 | |
| evidence[2] schoenfeld-2017 | yes | 1 | efetch text |
| evidence[3] schoenfeld-2016 | yes | 1 | efetch text, CONCLUSIONS paragraph |
| evidence[4] maeo | yes | 1 | abstract, Conclusion |
| evidence[5] kinoshita | yes | 1 | abstract, Conclusion |

OCR note: the Gray text has errors around several quotes ("Pectorahs", "cUmbing", "jn",
"hmb", "Glutseus/Glutaeus" for "Glutæus", "suppUed"). No quote contains one; the author trimmed
around them. This means two quotes (pectoralis_major[1], semitendinosus[1]) do not name their
subject or condition inside the quoted words; the paraphrase takes those from the adjacent
clause of the same sentence (noted below as "adjacent clause").

## 2. Paraphrase check

Yardstick: the quote. "Adjacent clause" = the words of the same sentence immediately before or
after the quote; I count that as supported. Anything taken from elsewhere in the source, or
not in the source, is marked overreaches.

| Entry | Verdict | Explanation |
|---|---|---|
| pectoralis_major[0] | supported | "Acting alone" is the adjacent clause ("If acting alone,"). |
| pectoralis_major[1] | supported | Subject and "raised" come from the adjacent clause ("If the arm has been raised by the Deltoideus, the Pectoralis major will,"). |
| deltoid[0] | supported | |
| deltoid[1] | supported | |
| deltoid[2] | supported | |
| latissimus_dorsi[0] | supported | "upper arm" = humerus. |
| latissimus_dorsi[1] | supported | "principally employed" -> "main muscle"; "felling" -> "chopping down". |
| latissimus_dorsi[2] | supported | "as in climbing" is the adjacent clause. Paraphrase drops "assist the abdominal muscles and Pectorales", an omission, not an addition. "hang the body from the arms" renders "suspending ... the trunk" with "both arms be fixed". |
| trapezius[0] | supported | |
| trapezius[1] | supported | Minor: "carrying weights" for "supporting weights"; suggest "supporting". |
| trapezius[2] | supported | |
| serratus_anterior[0] | supported | Minor gloss: "around the chest" is not in the quote (quote: "carries the scapula forward"). Suggest dropping it. |
| serratus_anterior[1] | supported | |
| serratus_anterior[2] | supported | Condition "after the Deltoideus has raised the arm to a right angle" is the adjacent clause and is named in the locator. |
| biceps_brachii[0] | supported | "(turns the palm up)" is a definition of supinator, not a new function. |
| biceps_brachii[1] | supported | |
| triceps_brachii[0] | supported | "great extensor" -> "main muscle that straightens the elbow". |
| triceps_brachii[1] | **overreaches** | Quote restricts it: "When the arm is extended, the long head ... may assist". The text drops the condition and states it unconditionally. Fix: "With the arm extended, its long head can help ...". |
| rectus_abdominis[0] | supported | |
| rectus_abdominis[1] | supported | "tilts the pelvis up toward the spine" glosses "flex the pelvis upon the vertebral column"; the literal wording is kept in brackets. |
| rectus_abdominis[2] | supported | Group statement; "the muscles" in Gray's sentence are the antero-lateral abdominal muscles (Obliqui, Transversus, Recti). Text says so. |
| gluteus_maximus[0] | supported | "extends the femur" -> "extends the hip". |
| gluteus_maximus[1] | supported | |
| gluteus_maximus[2] | supported | "of the limb" follows the quote. |
| quadriceps_femoris[0] | supported | Gray's "leg" = lower leg; "extends the leg upon the thigh" = straightens the knee. |
| quadriceps_femoris[1] | supported | "It" = Rectus femoris (previous sentence); "tilts the pelvis forward" glosses "flex the pelvis". |
| quadriceps_femoris[2] | supported | |
| biceps_femoris[0] / semitendinosus[0] / semimembranosus[0] | supported | Group statement, labelled as such. |
| biceps_femoris[1] | supported | |
| biceps_femoris[2] / semitendinosus[2] / semimembranosus[2] | supported | "as when rising from a stooped position" is the adjacent clause ("as in raising it from the stooping position"). Group statement, labelled. |
| semitendinosus[1] / semimembranosus[1] | supported | "With the knee half bent" is the adjacent clause ("When the knee is semiflexed, ... and"). |
| gastrocnemius[0] / soleus[0] | supported | Dated wording handled correctly: Gray's ankle-joint section (Syndesmology, p. 351-352) says "The movements of the joint are those of dorsiflexion and extension; ... in extension the heel is drawn up and the toes pointed downward", i.e. plantar flexion. "The muscles of the calf" in Gray = Gastrocnemius, Soleus, Plantaris (superficial group); the text says "as a group". |
| gastrocnemius[1] / soleus[1] | supported | Group statement, labelled. |
| gastrocnemius[2] | supported | "helps" reflects ", assisted by the Popliteus" after the quote. |
| soleus[2] | supported | |
| evidence[0] baz-valle | **overreaches** | Quote supports only: 12-20 weekly sets per muscle group may be an optimum standard in young, trained men. Text adds the design and inclusion criteria (RCTs, interventions >= 6 weeks, >= 1 year training, age 18-35): these are in the abstract (same locator) but not in the quote. Text also adds "it was not shown for beginners, women or older adults": not stated anywhere in the abstract; it is an inference from the inclusion criteria. Note the abstract's criteria say "participants", not "men"; only the conclusion sentence says "men". |
| evidence[1] baz-valle | **overreaches** | Quote says "no differences between moderate and high training volume responses" for quadriceps (p = 0.19) and biceps brachii (p = 0.59). Text (a) defines moderate = 12-20 and high = > 20 sets and (b) gives "seven included, six pooled": both are in the abstract, not the quote; (c) renders a non-significant difference as "did not grow ... more than", which overstates a null result (absence of a detected difference, 6 studies). The same abstract also reports high volume better for triceps brachii (p = 0.01), which the file omits entirely (see section 6). |
| evidence[2] schoenfeld-2017 | **overreaches** (minor) | "meta-regression" and "15 studies" are in the abstract, not the quote. "more weekly sets" matches the abstract's "weekly sets" analyses. Caveat sentence in text is accurate. |
| evidence[3] schoenfeld-2016 | **overreaches** (minor) | "volume-equated" is the adjacent clause and "whether three times beats twice ... not determined" is the next sentence: both fine. "across ten studies" is from the METHODS paragraph, not the quote; and the ten studies are the ones identified overall, not necessarily all in the 1-vs-2 comparison. |
| evidence[4] maeo | **overreaches** | Quote supports only "seated > prone leg curl for hamstrings muscle size". Text adds 12 weeks, 20 healthy adults, within-person design, and the biarticular/monoarticular split: all in the abstract's Methods/Results ("Twenty healthy adults ... 12 wk"; "each biarticular (+8%-24% vs +4%-19%), but not monoarticular (+10% vs +9%)"), none in the quote. Content is correct; the quote is too short for it. Note for the tutor: the monoarticular hamstring is the biceps femoris short head, which is inside our `biceps_femoris` id. |
| evidence[5] kinoshita | **overreaches** | Quote supports only "standing > seated calf-raise for gastrocnemius hypertrophy". Text adds 12 weeks, 14 untrained adults, within-person design, and "soleus growth was similar": all in the abstract's Methods/Results ("Fourteen untrained adults ... 12 weeks"; "similar between legs in the soleus (2.1% vs. 2.9%, p = 0.410)"), none in the quote. Content is correct; the quote is too short. The quote itself contains the authors' recommendation ("therefore recommended"); the text does not amplify it. |

Population limits, stated plainly for the tutor: evidence[0]-[1] young (18-35), >= 1 year trained,
conclusion worded for men; evidence[2]-[3] population not given in the abstracts; evidence[4]
20 healthy (young) adults, training status not stated in the abstract; evidence[5] 14 untrained
adults. Every evidence claim comes from a single abstract or single study; none generalises
across populations.

## 3. Locator check

Checked all 48 (42 Gray, 6 papers). Headings: every section named in a Gray locator exists in
the OCR text at the stated level: "I. THE MUSCLES CONNECTING THE UPPER EXTREMITY TO THE VERTEBRAL
COLUMN", "II. THE MUSCLES CONNECTING THE UPPER EXTREMITY TO THE ANTERIOR AND LATERAL THORACIC
WALLS", "III. THE MUSCLES AND FASCIÆ OF THE SHOULDER", "IV. THE MUSCLES AND FASCIÆ OF THE ARM",
"THE ANTERO-LATERAL MUSCLES OF THE ABDOMEN", "3. The Muscles of the Gluteal Region", "1. The
Anterior Femoral Muscles", "4. The Posterior Femoral Muscles (Hamstring Muscles)", "2. The
Posterior Crural Muscles" / "The Superficial Group", and an "Actions." paragraph label precedes
every quoted passage. Evidence locators: "Abstract" (Baz-Valle, both quotes in the abstract);
"CONCLUSIONS" label exists in efetch 27102172; "Conclusion" label exists in both PMC abstracts.

Page numbers, read from the running heads in the OCR ("438 MYOLOGY" / "<HEAD> 439") on each side
of the quote, cross-checked against the book's table of contents:

| Locator page | Claims | Actual page | Verdict |
|---|---|---|---|
| p. 439 (pectoralis, serratus) | 5 | between head "... SHOULDER 439" and "440 MYOLOGY" | correct |
| p. 440 (deltoid) | 3 | between "440 MYOLOGY" and "... 441" | correct |
| p. 435 (trapezius, latissimus) | 6 | between "... 435" and "436 MYOLOGY" | correct |
| p. 444 (biceps) | 2 | 2,775-3,107 chars after "444 MYOLOGY"; TOC: Brachialis 444, Triceps 444 | correct |
| pp. 444-445 (triceps) | 2 | 6,361 chars after "444 MYOLOGY" (a page is ~4,000); TOC: Antibrachial Fascia 445 | the passage is on p. 445; the range covers it (imprecise, not wrong) |
| p. 417 / p. 418 (rectus abdominis) | 3 | "418 MYOLOGY" head sits between claim [2] and claims [0],[1] | correct |
| p. 471 (quadriceps) | 3 | after head "... 471", immediately before "2. The Medial Femoral Muscles" (TOC: 471) | correct |
| **p. 477 (gluteus maximus)** | 3 | "478 MYOLOGY" head is 884 chars *before* the quote; next head "... 479" | **wrong, should be p. 478** |
| **p. 479 (hamstrings)** | 9 | "480 MYOLOGY" head is 307 chars *before* the "Actions." paragraph | **wrong, should be p. 480** |
| **p. 482 (calf)** | 6 | head "... CRURAL MUSCLES 483" is 2,809 chars before the quote; "484 MYOLOGY" after; TOC: Soleus 483, Plantaris 483 | **wrong, should be p. 483** |

Verified: 24 claims with correct page, 2 with an imprecise range, 18 with the wrong page.
Inferred: page boundaries from OCR running heads, which are reliable here (each head
interrupts a sentence mid-flow); I did not open page images.

## 4. exercises.json and dataset-muscle-map.json

Fresh `dist/exercises.json`: 876 records, 876 unique ids, 17 distinct muscle-group names
(abdominals, abductors, adductors, biceps, calves, chest, forearms, glutes, hamstrings, lats,
lower back, middle back, neck, quadriceps, shoulders, traps, triceps). Map has exactly those 17.

All 38 links: `datasetId` exists; `name`, `datasetPrimary`, `datasetSecondary` equal the dataset
arrays exactly (order included); `role` = "primary" is right for all 38 (each muscle id is
mapped from a group in that record's `primaryMuscles`); `cite.locator` equals the id and
`cite.quote` is one of the record's group names. All 38 are `level: beginner`, `category:
strength`. 0 mismatches.

Mapping judgement (no wrong or misleading group -> id mapping):

- `abdominals -> rectus_abdominis`, `chest -> pectoralis_major`, `glutes -> gluteus_maximus`,
  `shoulders -> deltoid`: each group is wider than the single seed muscle; the `why` text says so.
  Acceptable, but the tutor must say "chest group" not "pectoralis major" when citing the dataset.
- `calves -> gastrocnemius, soleus`: correct as a group mapping, but it makes **Seated Calf Raise
  a "primary" exercise for gastrocnemius**, while evidence[5] (Kinoshita) reports 0.6-1.7 %
  gastrocnemius growth from seated calf raises versus 9-12 % standing. Not a data error, but a
  trap: the tutor could present both as equal gastrocnemius exercises. Suggest the tutor prompt
  rank evidence over dataset role, or annotate that link.
- `hamstrings -> three ids`: same pattern; evidence[4] (Maeo) says seated > prone (lying) leg
  curl for the biarticular hamstrings. Same trap, smaller.
- `middle back -> []`, `lower back -> []`, `neck`, `forearms`, `abductors`, `adductors -> []`:
  conservative and right. (Leaving "middle back" unmapped means no row/retraction exercise is
  linked to trapezius; shrugs only. A gap, not an error.)
- `lats`, `traps`, `triceps`, `biceps`, `quadriceps`: plain synonyms, correct. The `biceps` note
  (hamstrings use a separate name) was checked: true in the data.

## 5. Licences

| Source | Page prints | Stored string | Verdict |
|---|---|---|---|
| gray-1918-myology | archive.org metadata: "Possible copyright status NOT_IN_COPYRIGHT", "Copyright-region US", "Copyright-evidence: Evidence reported by judyjordan ... on April 27, 2007: visible notice of copyright; stated date is 1918". Commons: "This work is in the public domain in the United States because it was published (or registered with the U.S. Copyright Office) before January 1, 1931." Book front matter: "Copyright LEA & FEBIGER 1918". | all three, quoted | matches (the IA evidence string is quoted from "visible notice ..." onward) |
| free-exercise-db | README badge "License: Unlicense", README line 3 "Open Public Domain Exercise Dataset", LICENSE.md is the Unlicense text ("for any purpose, commercial or non-commercial"). README credits Ollie Jennings / wrkout/exercises.json. | "License: Unlicense (README badge); README: Open Public Domain Exercise Dataset" | matches. `year: 2026` is not printed anywhere I read; unverifiable. |
| baz-valle-2022 | "This work is licensed under the Creative Commons Attribution-NonCommercial-NoDerivatives 3.0 License." | same | matches. **CC BY-NC-ND**: no commercial use, no derivatives. Short attributed quotes are fine; the `text` paraphrase restates facts, not expression, so it is not a derivative of the article, but confirm before any commercial release. |
| schoenfeld-2017-volume | efetch text prints no licence | "Not stated (PubMed abstract record only ...)" | matches. Underlying article is paywalled (J Sports Sci). The abstract text is the publisher's; a one-sentence attributed quote is quotation, not reuse. Not verified: NLM's own terms for PubMed abstracts. |
| schoenfeld-2016-frequency | same | same | matches, same caveat (Sports Med, Springer). |
| maeo-2021-hamstrings | "This is an open-access article distributed under the terms of the Creative Commons Attribution-Non Commercial-No Derivatives License 4.0 (CCBY-NC-ND), where it is permissible to download and share the work provided it is properly cited. The work cannot be changed in any way or used commercially without permission from the journal." | first clause only, up to "(CCBY-NC-ND)" | **incomplete**: the stored string omits the sentence that states the restriction. Store the whole statement. |
| kinoshita-2023-calf | "This is an open-access article distributed under the terms of the Creative Commons Attribution License (CC BY). The use, distribution or reproduction in other forums is permitted, provided the original author(s) and the copyright owner(s) are credited and that the original publication in this journal is cited ..." | first sentence | matches (CC BY, no NC/ND). |

AI-use / commercial restrictions: none of the article pages, the archive.org pages, the Commons
page, the README or LICENSE.md contain any clause about AI or machine use (searched for
"artificial intelligence", "machine learning", "text mining"; 0 hits). The PMC copyright policy
page only prohibits "systematic downloading of batches of articles"; three single-article fetches
do not meet that. **Not read**: archive.org Terms of Use, GitHub Terms of Service, Sciendo /
Wolters Kluwer / Frontiers site terms, NLM's PubMed terms. The restrictive sources are the two
NC-ND papers (Baz-Valle, Maeo): commercial use and adaptation need permission; the current use is
a short quotation with citation. OpenStax is absent from sources.json, as intended.

## 6. Other findings (risk for a tutor that must not exceed its sources)

1. **Missing triceps result from Baz-Valle.** The same abstract states "a high training volume
   is better to induce muscle mass gains in the triceps brachii (p = 0.01)". evidence[0]
   (`appliesTo: "all"`) tells the tutor 12-20 sets is the optimum for every muscle, so a triceps
   question gets an answer the cited abstract contradicts. Add a triceps claim or restrict
   evidence[0]'s appliesTo / wording.
2. **evidence[5] appliesTo omits soleus** although the text makes a soleus statement ("soleus
   growth was similar"). A soleus query never surfaces it. Add `soleus` or split the claim.
3. **The 25-word quote limit is forcing paraphrases past their quotes** (all 6 evidence claims).
   Either allow a cite to carry several short quotes, or trim `text` to the quote and move the
   study details into a second claim with its own quote.
4. **Schoenfeld claims rest on abstracts the author did not open the full text of**, and the
   texts say so. Fine for honesty, but the tutor should present them as "abstract-level".
5. **Gray 1918 is a 108-year-old descriptive anatomy text.** The nomenclature translations in
   `text` (leg = lower leg, extension of foot = plantar flexion, Glutæus) are correct, and the
   calf one is flagged in the text. Consider a one-line note in the tutor prompt that Gray's
   action statements are descriptive, pre-EMG claims.
6. **Group quotes duplicated under three ids** (hamstrings) and two ids (calves): the `text`
   labels them "Group statement", which is enough, provided the tutor repeats the label.
7. **Two quotes lack their subject because of OCR damage** (pectoralis_major[1], where the OCR
   reads "Pectorahs major"; semitendinosus[1] starts mid-sentence). If the tutor shows quotes to
   users, these two will look unanchored. Acceptable, but the locator should mention it (it does
   for pectoralis_major[1]: "when the arm has been raised").
8. `sources.json` free-exercise-db `url` is the repo page, while the data actually used is
   `dist/exercises.json` on raw.githubusercontent.com; the title names the file, so this is
   clear enough. The dataset changes over time; `readOn` is the only pin. Consider recording the
   commit SHA.

## Recommended edits (no fixes applied)

| Entry | Action | Reason |
|---|---|---|
| triceps_brachii[1] `text` | edit: "With the arm extended, its long head can help ..." | drops the quote's condition |
| gluteus_maximus[0..2] `locator` | edit p. 477 -> p. 478 | OCR running head "478 MYOLOGY" precedes the passage |
| biceps_femoris / semitendinosus / semimembranosus [0..2] `locator` (9) | edit p. 479 -> p. 480 | "480 MYOLOGY" precedes the Actions paragraph |
| gastrocnemius / soleus [0..2] `locator` (6) | edit p. 482 -> p. 483 | head "... 483" precedes the passage; TOC puts Soleus and Plantaris on 483 |
| triceps_brachii[0..1] `locator` | optional: "pp. 444-445" -> "p. 445" | passage is on 445 |
| evidence[0] `text` | delete the sentence "it was not shown for beginners, women or older adults" or reword to "the review included only ..." with a quote that supports it; move the inclusion criteria into a separate claim quoting "interventions lasted at least six weeks, c) participants had a minimum of one year of resistance training experience, d) participants' age ranged from 18 to 35 years" (24 words) | inference and numbers not in the quote |
| evidence[1] `text` | reword "did not grow ... more than" to "no significant difference in growth was found between 12-20 and more than 20 weekly sets"; add a quote for the group definitions ("moderate" (12-20 weekly sets) and "high" volume (>20 weekly sets)) or drop the numbers | null result overstated; numbers not in quote |
| evidence (new) | add a triceps claim: quote "a high training volume is better to induce muscle mass gains in the triceps brachii (p = 0.01)", appliesTo ["triceps_brachii"] | otherwise evidence[0] misleads for triceps |
| evidence[2] `text` | drop "meta-regression of 15 studies" or add a quote covering "The final analysis comprised 34 treatment groups from 15 studies" | number not in quote |
| evidence[3] `text` | drop "across ten studies" or quote "A total of ten studies were identified" | number not in quote |
| evidence[4] `text` | trim to the quote, or add a second cite quoting "Twenty healthy adults conducted seated leg curl training with one leg (Seated-Leg) and prone with the other (Prone-Leg)" and the biarticular/monoarticular result | details not in quote |
| evidence[5] `text`, `appliesTo` | trim to the quote or add a cite quoting "Fourteen untrained adults conducted calf-raise training with one leg in a standing/knee-extended position and the other leg in a seated/knee 90°-flexed position"; add `soleus` to appliesTo, with the soleus quote "similar between legs in the soleus (2.1% vs. 2.9%, p = 0.410)" | details not in quote; soleus claim invisible to soleus |
| sources.json maeo `licence` | append "The work cannot be changed in any way or used commercially without permission from the journal." | page prints it; it is the operative restriction |
| sources.json free-exercise-db `year` | replace 2026 with the commit date/SHA actually downloaded, or delete | not printed on the page |
| serratus_anterior[0] `text` | optional: drop "around the chest" | gloss not in quote |
| trapezius[1] `text` | optional: "supporting weights" | closer to quote |
| exercises.json gastrocnemius Seated_Calf_Raise | keep, but have the tutor rank evidence[5] above the dataset role | dataset says primary; cited study says it barely grows the gastrocnemius |

Nothing is "not found verbatim". Nothing was unverifiable except the items listed as not read
(site-wide terms of service) and the dataset's year.
