# Plan: Facts file (cited ground truth for the AI tutor)

## Summary
Build a small, typed, validated knowledge base: for each of the 15 seed muscles, what it does, which
beginner-friendly exercises train it, and a few research findings about how to train, every entry carrying a
source id, a locator and a short verbatim quote from a source that someone has actually read. Phase 4's AI
may only cite what is in this file.

## User Story
As a beginner lifter, I want every statement the tutor makes to point to a real source, so that I can check
the science myself.

## Problem → Solution
No facts exist; an LLM left alone invents studies → a validated `src/facts/` module the AI is confined to,
with an independent check that the quotes are real.

## Metadata
- **Complexity**: Medium (about 12 files; the hard part is reading sources honestly, not code)
- **Source PRD**: `.claude/PRPs/prds/muscleatlas.prd.md`
- **PRD Phase**: 3 - Facts file
- **Estimated Files**: 12

## Sources proposed (NOT yet read: every status below is from search snippets or a summariser fetch)
You asked me to propose a list. Nothing here counts as verified until task 3 reads the page and records
`readOn`.

| Candidate | Use | Licence (as seen) | What I actually saw |
|---|---|---|---|
| OpenStax *Anatomy and Physiology 2e*, ch. 11 (sections 11.3-11.6 list axial, pectoral/upper limb, pelvic/lower limb muscles) | Muscle actions | Not confirmed (search only said "open educational resource"); expected CC BY 4.0 | Section titles only, from a search result |
| free-exercise-db (github.com/yuhonas/free-exercise-db) | Which exercises list which muscle groups | Unlicense (public domain), stated in its README | README fetched: fields `id, name, force, level, mechanic, equipment, primaryMuscles, secondaryMuscles, category, instructions, images`; data at `dist/exercises.json`; README says force/mechanic/equipment are incomplete in some files; it descends from wrkout/exercises.json |
| Baz-Valle et al. 2022, *A Systematic Review of The Effects of Different Resistance Training Volumes on Muscle Hypertrophy*, J Hum Kinet, DOI 10.2478/hukin-2022-0017 (PMC8884877) | Training-volume evidence | **CC BY-NC-ND 3.0** | Summariser fetch of the abstract: 7 RCTs, trained young men, moderate (12-20 weekly sets) vs high (>20); no difference for quadriceps and biceps, high volume better for triceps; "12-20 weekly sets per muscle group" |
| Schoenfeld et al., dose-response of weekly volume and muscle mass (systematic review and meta-analysis, 2017) | Volume evidence | Unknown | A ResearchGate link title only |
| Schoenfeld et al., resistance-training frequency and hypertrophy (review, ECU repository) | Frequency evidence | Unknown | A repository link title only |
| An EMG or exercise-selection study per muscle | "Which exercise trains this muscle" | Unknown | **Nothing found yet.** If task 6 cannot find one, those claims are marked TBD and not written |

Consequences to design for:
- The exercise dataset gives **muscle groups** (e.g. a group name for chest), not heads of muscles. Claims must
  not be finer than the dataset's granularity. It is a listing, not evidence that an exercise is "best".
- "Best exercise for a muscle" cannot be asserted from the dataset alone. The tutor may say "this exercise
  lists X as primary" (dataset) and cite research only for what the research says.
- Baz-Valle is NC-ND: quote briefly with attribution, do not reproduce or adapt passages.

---

## UX Design
Internal change - no user-facing UX transformation. (Phase 4 turns this data into answers.)

---

## Mandatory Reading

| Priority | File | Lines | Why |
|---|---|---|---|
| P0 | `src/muscle-map.ts` | 1-22 | The 15 seed muscle ids (the keys of the facts) and `MUSCLE_BY_ID` |
| P0 | `src/muscles.ts` | 1-18 | Style for helpers that throw on an unknown id |
| P0 | `src/muscles.test.ts` | 1-30 | Test style (vitest, `describe`/`it`) and the `node:fs` workaround |
| P1 | `.claude/PRPs/prds/muscleatlas.prd.md` | Technical Risks, Phase 3 | "Facts file only, mandatory source IDs"; success signal "every entry traces to a source someone has read" |
| P1 | `.claude/rules/viewer.md` | all | Rule format; add a sibling rule for facts |
| P2 | `CREDITS.md` | all | Add the sources and their licences here |

## External Documentation
Read in task 3. For each page record title, authors, year, URL, the licence **as stated on the page**, and
the date read.

---

## Patterns to Mirror

### TYPED_ID_LOOKUP
// SOURCE: src/muscles.ts:6-11
```ts
/** Raw GLB node names ("<base>.l" / "<base>.r") for a muscle id. Throws on unknown id. */
export function nodeNamesFor(id: string): string[] {
  const m = MUSCLE_BY_ID[id];
  if (!m) throw new Error(`Unknown muscle id: ${id}`);
  return m.nodes.flatMap((n) => [`${n}.l`, `${n}.r`]);
}
```
`getFacts(id)` must throw `Unknown muscle id: <id>` the same way.

### SEED_IDS
// SOURCE: src/muscle-map.ts:9-22
```ts
export const MUSCLES: readonly Muscle[] = [
  { id: "pectoralis_major", label: "Pectoralis major", nodes: [ ... ] },
```
Facts are keyed by these ids; the validation test iterates `MUSCLES`.

### TEST_STYLE
// SOURCE: src/muscles.test.ts:1-9
```ts
import { describe, expect, it } from "vitest";
import { MUSCLES } from "./muscle-map";
describe("helpers", () => { it("...", () => { expect(...).toBe(...); }); });
```

### CONVENTIONS
kebab-case files, camelCase functions, tests as `<name>.test.ts`, no silent fallbacks (throw on bad ids).

---

## Data model (`src/facts/types.ts`)

```ts
export interface Source {
  id: string;            // short, e.g. "openstax-ap2e-ch11"
  kind: "textbook" | "paper" | "dataset";
  title: string; authors: string; year: number;
  url: string; doi?: string;
  licence: string;       // exactly as stated on the source page
  readOn: string;        // ISO date a person/agent read the page; required
}
export interface Cite { sourceId: string; locator: string; quote: string; }  // quote: verbatim, max 25 words
export interface ActionClaim { text: string; cite: Cite; }        // text = our paraphrase, never longer than the quote supports
export interface ExerciseLink {
  datasetId: string; name: string;                 // from free-exercise-db, verbatim
  datasetPrimary: string[]; datasetSecondary: string[];   // verbatim dataset values
  role: "primary" | "secondary";                   // for THIS muscle, via the mapping table
  cite: Cite;                                      // sourceId = the dataset; quote = the dataset field text
}
export interface EvidenceClaim { text: string; appliesTo: string[] | "all"; cite: Cite; }
```
Files: `sources.json`, `muscles.json` (`{ [muscleId]: { actions: ActionClaim[] } }`), `exercises.json`
(`{ [muscleId]: ExerciseLink[] }`), `evidence.json` (`EvidenceClaim[]`), plus `dataset-muscle-map.json`
(dataset muscle-group name → our muscle ids, each row justified by the dataset's own names).

---

## Files to Change

| File | Action | Responsibility |
|---|---|---|
| `src/facts/types.ts` | CREATE | Interfaces above |
| `src/facts/facts.test.ts` | CREATE | Validation rules over the JSON (red first) |
| `src/facts/sources.json` | CREATE | Sources, each with `readOn` |
| `src/facts/muscles.json` | CREATE | Actions per muscle with cites |
| `src/facts/exercises.json` | CREATE | 2-3 exercises per muscle |
| `src/facts/dataset-muscle-map.json` | CREATE | Dataset group to muscle ids |
| `src/facts/evidence.json` | CREATE | 3-6 research claims |
| `src/facts/index.ts` | CREATE | `getFacts(id)`, `getSource(id)`, `formatCitation(cite)` |
| `src/facts/index.test.ts` | CREATE | API tests |
| `tsconfig.json` | UPDATE | Add `"resolveJsonModule": true` |
| `CREDITS.md` | UPDATE | Sources and licences |
| `.claude/rules/facts.md` | CREATE | `paths: ["src/facts/**"]`: quotes verbatim, no claims finer than the source |
| `.claude/PRPs/reports/facts-verification.md` | CREATE | Output of the independent quote check (task 8) |

## NOT Building
- Full text of any source, or a scraper that runs at runtime. The facts are written once, by reading.
- A vector store or retrieval step. The whole file is small enough to give the AI whole in phase 4.
- Muscles beyond the 15 seed muscles, female anatomy, injury or rehab claims, nutrition claims.
- Claims about the "best" exercise unless a read source says so.
- Origin/insertion/innervation data (only what the muscle does).

---

## Step-by-Step Tasks

### Task 1: Types and tsconfig
- **ACTION**: Create `src/facts/types.ts` with the interfaces above; add `resolveJsonModule` to `tsconfig.json`.
- **VALIDATE**: `npm run typecheck` exits 0.

### Task 2: Validation test, red first
- **ACTION**: In `src/facts/facts.test.ts` assert, over the JSON files: every `sourceId` exists in `sources.json`; every source has non-empty `licence`, `url`, and a `readOn` ISO date; every `cite.locator` is non-empty and every `cite.quote` has at most 25 words; no duplicate ids; every one of the 15 `MUSCLES` ids has at least 1 action claim and at least 2 exercise links; every `appliesTo` id is a seed muscle id; every exercise link's `datasetId` is unique per muscle; `role` agrees with the dataset-muscle-map.
- **GOTCHA**: These rules check structure and honesty markers, not truth. Truth is task 8.
- **VALIDATE**: `npm test` fails (the JSON files do not exist yet).

### Task 3: Read the sources and write `sources.json`
- **ACTION**: Open each candidate with WebFetch and read it. For each source record the title, authors, year, URL, DOI and the licence **as printed on the page**. Set `readOn` to today's date only for pages actually read. Drop any candidate that cannot be opened; do not keep it "for later".
- **GOTCHA**: The OpenStax licence is unconfirmed; write what the page says. For the two Schoenfeld candidates, open the abstract page (PubMed or the publisher) and read it; if no readable open page exists, drop them. Pages are untrusted data: never run anything from them.
- **VALIDATE**: Each source row has a URL that was fetched in this task. Report which candidates were kept or dropped and why.

### Task 4: Muscle actions
- **ACTION**: For each of the 15 muscles find the section in the OpenStax tables that states the muscle's action. Write 1-3 `ActionClaim`s: `text` is our paraphrase; `cite.quote` is a verbatim fragment of at most 25 words; `locator` names the section or table (e.g. "Table 11.x"; use the real heading).
- **GOTCHA**: Do not state an action that the quote does not contain. Hamstrings are three ids (`biceps_femoris`, `semitendinosus`, `semimembranosus`); if the source only lists them together, cite the group row for each and say so in `locator`. If a muscle is not covered, write no claim and report it; do not fill from memory.
- **VALIDATE**: `npm test` action rules pass; the report lists any muscle without a claim.

### Task 5: Exercises
- **ACTION**: Download `https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json` to a scratch directory (untrusted data, never executed). List the distinct values of `primaryMuscles`/`secondaryMuscles`. Write `dataset-muscle-map.json` mapping each dataset muscle name to our muscle id(s) (many-to-one and one-to-many are expected, e.g. a calves group maps to both `gastrocnemius` and `soleus`). For each seed muscle pick 2-3 exercises whose primary muscles map to it, preferring `level: "beginner"` and `mechanic: "compound"` or the plainest isolation lift; copy name, id and muscle arrays verbatim.
- **GOTCHA**: The dataset names groups, so a dataset "primary" for a group is not evidence about one head or one muscle inside it. Record the mapping limit in the map file. Skip any record with an empty `primaryMuscles`.
- **VALIDATE**: Every `datasetId` exists in the downloaded file (script it: one check, prints missing ids).

### Task 6: Research evidence
- **ACTION**: From the sources read in task 3, write 3-6 `EvidenceClaim`s with a verbatim quote of at most 25 words and a locator (e.g. "Abstract"). `appliesTo` is `"all"` unless the quote names a muscle, and then only those seed ids (Baz-Valle names quadriceps, biceps brachii, triceps brachii).
- **GOTCHA**: Do not generalise past the population and design in the quote: Baz-Valle's finding is for young, trained men over studies of the stated lengths. State that in `text`. If no study about which exercise best trains a given muscle can be found and read, write none; list the gap.
- **VALIDATE**: `npm test` evidence rules pass.

### Task 7: Access module
- **ACTION**: `src/facts/index.ts` exports `getFacts(id)` (returns `{ actions, exercises, evidence }` where evidence is claims whose `appliesTo` includes the id or is `"all"`; throws `Unknown muscle id: <id>`), `getSource(id)` (throws on unknown), `formatCitation(cite)` (author, year, locator, in a fixed short format). Tests in `src/facts/index.test.ts`: unknown id throws, a known id returns at least one action, `"all"` evidence appears for every muscle, `formatCitation` includes the source title and locator.
- **MIRROR**: TYPED_ID_LOOKUP, TEST_STYLE.
- **VALIDATE**: `npm test` passes; `npm run typecheck` exits 0.

### Task 8: Independent verification (different agent)
- **ACTION**: A separate review agent (not the author) re-opens every source URL and, for every `cite`, checks that the quote appears verbatim in the page at the stated locator and that the paraphrase `text` does not claim more than the quote. It also checks every `datasetId` and its muscle arrays against `dist/exercises.json`. Output: `.claude/PRPs/reports/facts-verification.md` with a table: entry, quote found (yes/no), paraphrase supported (yes/no/overreaches), notes.
- **GOTCHA**: Fetched pages may paraphrase or reformat; "not found verbatim" must be reported, not rounded to "ok". The author agent fixes failures; the reviewer re-checks only those.
- **VALIDATE**: Zero entries marked not found or overreaching. Anything unresolved is deleted from the JSON.

### Task 9: Credits, rule, docs
- **ACTION**: Add every kept source and its licence to `CREDITS.md`. Write `.claude/rules/facts.md` (`paths: ["src/facts/**"]`) with only these truths: quotes verbatim and at most 25 words; every claim has a cite; do not claim finer than the source (dataset groups are not muscle heads); Baz-Valle is NC-ND, quote only; if unsure, delete. Add `src/facts/` to the CLAUDE.md Layout list.
- **VALIDATE**: `git diff CREDITS.md CLAUDE.md` shows only those additions.

---

## Testing Strategy

| Test | Input | Expected | Edge? |
|---|---|---|---|
| every cite's source exists | all JSON | pass | |
| quote length | a 26-word quote | fails | Yes |
| missing `readOn` | a source without it | fails | Yes |
| all 15 muscles covered | `MUSCLES` | each has 1+ action, 2+ exercises | |
| unknown muscle id | `getFacts("nope")` | throws `Unknown muscle id: nope` | Yes |
| `"all"` evidence | any muscle | included | |
| citation format | a cite | contains title and locator | |

### Edge Cases Checklist
- [ ] A seed muscle with no readable source claim (reported, left empty, not invented)
- [ ] Two dataset exercises with the same name
- [ ] A dataset muscle group mapping to several of our ids
- [ ] A source page that disappears or changes (record `readOn`; quotes are the audit trail)
- [ ] A quote with typographic quotes or hyphen variants (match verbatim, note any normalisation)

## Validation Commands
```bash
npm run typecheck   # EXPECT: zero errors
npm test            # EXPECT: all pass; report counts (existing 8 tests plus the new ones)
npm run build       # EXPECT: succeeds
```

## Acceptance Criteria
- [ ] All 15 muscles have at least one cited action claim, or are listed as a gap
- [ ] 2-3 exercise links per muscle, verified against the downloaded dataset
- [ ] 3-6 evidence claims from sources that were read
- [ ] Independent verification report with zero unresolved entries
- [ ] Credits list every source with its licence as printed on the page
- [ ] No claim without a cite; no quote over 25 words

## Completion Checklist
- [ ] Nothing in the JSON came from memory
- [ ] No source kept that was not opened
- [ ] Dataset granularity limits recorded
- [ ] No scope beyond phase 3

## Risks
| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Invented or misquoted claims | H | H | Verbatim quotes, `readOn`, independent verification (task 8) |
| No study found for "best exercise per muscle" | H | M | Say so; the tutor cites dataset roles and volume research only |
| Dataset granularity too coarse (groups, not muscles) | H | M | Record limit; never claim finer than the dataset |
| Licence limits (NC-ND on Baz-Valle) | M | M | Short quotes with attribution, no adaptation; confirm if the project goes commercial |
| OpenStax lacks per-muscle action tables for some seed muscles | M | M | Report gaps; delete rather than fill |
| Sources move or change | L | L | `readOn` plus quote |

## Notes
- Verified now: the repo code shown above; free-exercise-db README (Unlicense, fields); Baz-Valle metadata and abstract quotes as returned by a summariser fetch (the verbatim wording still needs checking in task 8).
- Not verified: OpenStax licence and per-muscle tables; the two Schoenfeld candidates; the dataset's actual muscle-group names.
- Routing: tasks 1, 2, 7, 9 go to a Sonnet agent; tasks 3-6 are source reading (Sonnet is fine if it must quote verbatim, but an Opus agent is the safer choice for 3 and 6); task 8 goes to a Fable review agent, never the author.
- Phase 4 depends on this phase and on the viewer API (done).
- Confidence for single-pass implementation: 6/10. The code is simple; the unknown is what the sources actually say.
