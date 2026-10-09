# MuscleAtlas

## Problem Statement

Anatomy apps show where muscles are and how they move. Workout apps list exercises and which muscles they hit. Neither connects the two with the reasoning behind it, so a beginner who wants to train "scientifically" has no single place to learn why an exercise trains a muscle. The cost: beginners copy routines without understanding them.

## Evidence

- Assumption - needs validation through interviews with 5+ beginner lifters. The only evidence so far is the owner's own observation that existing apps are either anatomy-focused or workout-focused.
- Market scan (2026-10-08, search snippets only, not deeply read): Complete Anatomy and Visible Body are 3D anatomy/kinesiology tools aimed at students and clinicians. No product combining muscle learning with evidence-cited exercise selection was found. Absence of search results is not proof; re-check before claiming novelty.

## Proposed Solution

An interactive 3D male muscle model where an AI tutor (pretrained LLM, no model training) controls the view: it highlights muscles, moves the camera, and explains what a muscle does and how specific exercises train it. Every factual claim cites a credited source from a curated facts file, so the AI cannot cite what is not in it. The differentiator is the AI-driven, cited link between muscle function and exercise, not the model or the exercise list, which are both reproducible.

## Key Hypothesis

We believe a user-friendly, AI-guided way to learn muscles and the exercises that train them will enable a scientific approach to lifting for beginner lifters.
We'll know we're right when this becomes the way beginner lifters learn which exercise trains which muscle (owner's wording). Proposed measurable proxy: see Success Metrics.

## What We're NOT Building

- Female anatomy in v1 - planned for after the first version works.
- Workout logging, plans, user accounts, mobile apps - not decided; owner to revisit.
- Medical, clinical or rehab guidance - out of audience; avoids health-advice liability. (Proposed, confirm.)
- Training or fine-tuning a model - not needed to make AI central.

## Success Metrics

All targets are proposals, not agreed.

| Metric | Target | How Measured |
|--------|--------|--------------|
| Owner acceptance (agreed) | Owner tests it and likes it | Personal use |
| Cited answers | 100% of factual claims carry a source ID from the facts file | Manual check of 20 sample questions |
| Answer correctness | 0 invented studies in 20 sample questions | Manual check against the sources |
| Time to answer "what trains muscle X and why" | TBD, e.g. under 30 s | Stopwatch demo |
| Beginner usefulness | TBD, e.g. 3 of 5 beginners say they learned something | Short test sessions |

## Open Questions

- [ ] Which hackathon, and its deadline, team size, judging criteria and demo format? Candidates: DSH Hacks V2 ($100k+ prizes), UnivaBio ($40,000 prizes), AIC Internal Competition 2026 (Agentic AI). Category fit not yet checked; the AI-drives-the-model design maps most naturally to the agentic one, unverified.
- [ ] Vision in one sentence (skipped).
- [ ] Job to be done (skipped): "When ___, I want to ___, so I can ___".
- [ ] Non-users beyond female anatomy (skipped).
- [ ] Constraints (skipped): platform (web assumed), stack, AI model/API, budget for API calls.
- [ ] Does the Z-Anatomy male muscle set export to glTF with usable mesh names? Spike first.
- [ ] Which research sources go in the facts file, and who checks that they say what we claim?
- [ ] Is "exercise linking" a v1 Must? The owner chose model+highlight and cited AI explanation as must-haves, but the agreed MVP demo includes exercises. Listed as Must below; confirm.
- [ ] Primary user: "anyone" vs "beginner lifters" - the hypothesis says beginners; confirm.
- [ ] Skipped Phase 0.5 brainstorm and several Phase 4 answers at the owner's request.

---

## Users & Context

**Primary User** (provisional)
- **Who**: Beginner lifter who wants to understand the science of training; male anatomy first. Designed to be usable by anyone.
- **Current behavior**: Follows routines from apps or videos without knowing why.
- **Trigger**: Wants to understand the scientific reasoning behind a lift and how to maximise muscle gain (owner).
- **Success state**: Can say which muscle an exercise trains and why, with a source.

**Job to Be Done**
TBD - owner to supply.

**Non-Users**
TBD, apart from female anatomy being a later version.

---

## Solution Detail

### Core Capabilities (MoSCoW)

| Priority | Capability | Rationale |
|----------|------------|-----------|
| Must | 3D male muscle model (Z-Anatomy, credited) with highlight and camera control | Owner must-have 1 |
| Must | AI tutor that drives the model and explains with citations | Owner must-have 2; the point of the product |
| Must (confirm) | Link each muscle to 2-3 exercises with a cited reason | In the agreed MVP demo; the claimed gap in the market |
| Should | Click a muscle to ask about it | Cheap alternative entry point |
| Could | Movement animation | Impressive but costly |
| Won't (v1) | Female anatomy | Owner: after first version works |
| Won't | Logging, plans, accounts, native mobile | Not requested |

### MVP Scope

A rotating male muscle model. The user clicks a muscle or asks a question. The AI highlights the muscle, explains its function, and shows two or three exercises with a cited reason.

### User Flow

Open app -> click a muscle or type a question -> AI highlights and frames the muscle -> AI explains function with citations -> AI shows exercises that train it, with the reason and source.

---

## Technical Approach

**Feasibility**: MEDIUM-HIGH. The LLM tool-calling to scene-control pattern is standard (from general knowledge; the web search returned no usable source). The model pipeline is the unverified part.

**Architecture Notes**
- Web app with three.js (assumed, not decided). The LLM gets tools such as `highlight(muscle_id)`, `focus_camera(muscle_id)` and `cite(source_id)`.
- A curated facts file (muscle function, exercise links, sources) is the only knowledge the AI may cite.
- Z-Anatomy is CC BY-SA 4.0 and distributed as Blender files; export to glTF is required.
- Exercise-to-muscle seed data: free-exercise-db (public domain). It lists primary/secondary muscles only; it is not evidence that an exercise is "best".
- Evidence seeds found (titles only, unread): Schoenfeld dose-response meta-analysis on weekly volume; a resistance-training frequency and hypertrophy review.

**Technical Risks**

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| glTF mesh names do not map to the muscles the AI names | M | Spike first; build an explicit id-to-mesh mapping table |
| AI invents or overstates science | H | Facts file only, mandatory source IDs, reject uncited claims |
| CC BY-SA obligations missed | M | Credits screen; share derived model under the same licence |
| Exercise data mistaken for evidence | M | Cited claims only for "best"; label raw lists as basic data |
| Hackathon deadline unknown | H | Confirm deadline; keep MVP to the one flow |

---

## Implementation Phases

| # | Phase | Description | Status | Parallel | Depends | PRP Plan |
|---|-------|-------------|--------|----------|---------|----------|
| 1 | Model spike | Export Z-Anatomy male muscles to glTF; confirm mesh names | in-progress | - | - | [model-spike.plan.md](../plans/model-spike.plan.md) |
| 2 | Viewer | Web viewer with orbit, click-select, highlight, camera focus | pending | - | 1 | - |
| 3 | Facts file | Curated muscles, exercises and sources, with source IDs | pending | with 2 | 1 | - |
| 4 | AI tutor | LLM with scene tools, grounded in the facts file, citation enforcement | pending | - | 2, 3 | - |
| 5 | Polish and demo | Credits screen, sample questions, demo script | pending | - | 4 | - |

### Phase Details

**Phase 1: Model spike**
- **Goal**: Prove the model is usable on the web.
- **Scope**: Export the male muscle layer; list the meshes and names.
- **Success signal**: A glTF loads in a browser with identifiable muscles.

**Phase 2: Viewer**
- **Goal**: Interactive anatomy view without AI.
- **Scope**: Orbit, click-select, highlight, focus camera.
- **Success signal**: Any muscle in the mapping table can be highlighted from code.

**Phase 3: Facts file**
- **Goal**: Ground truth for the AI.
- **Scope**: Muscle functions and 2-3 exercises per major muscle, each with a source ID and a verified source.
- **Success signal**: Every entry traces to a source someone has read.

**Phase 4: AI tutor**
- **Goal**: AI drives the viewer and explains with citations.
- **Scope**: Tool calls, grounding, rejection of uncited claims.
- **Success signal**: 20 sample questions answered with 0 invented sources.

**Phase 5: Polish and demo**
- **Goal**: Demo-ready.
- **Scope**: Credits (Z-Anatomy, BodyParts3D, data sources), demo script.
- **Success signal**: A full demo run without intervention.

### Parallelism Notes

Phases 2 and 3 are independent once the mesh names are known; the facts file needs only the muscle id list.

---

## Decisions Log

| Decision | Choice | Alternatives | Rationale |
|----------|--------|--------------|-----------|
| Anatomy model | Z-Anatomy, credited | Licensed model, build own | Free, layered, credited per owner |
| AI approach | Pretrained LLM with tools, no training | Train own model | Owner: not needed to make AI central |
| Initial anatomy | Male only | Both | Owner: female after v1 works |
| Grounding | Curated facts file with source IDs | Free-form LLM knowledge | Credited-sources requirement; limits hallucination |

---

## Research Summary

**Market Context**
Complete Anatomy and Visible Body are 3D anatomy and kinesiology tools aimed at students and clinicians. Snippets only; no competitor combining muscle learning with cited exercise selection was found. Not exhaustively checked.

**Technical Context**
Z-Anatomy (CC BY-SA 4.0, built on BodyParts3D) provides layered muscle models as Blender files. free-exercise-db and wger provide exercise-to-muscle data. The licence of wger's data is not checked. No codebase exists yet.

---

*Generated: 2026-10-08*
*Status: DRAFT - needs validation*
