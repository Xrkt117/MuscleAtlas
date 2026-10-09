# 0002 — Muscle-action facts come from Gray's Anatomy 1918, not OpenStax

**Date:** 2026-10-09
**Status:** accepted

## Context
The AI tutor may only cite `src/facts/`. The first muscle-action pass quoted OpenStax Anatomy & Physiology 2e.
Its pages print: "This book may not be used in the training of large language models or otherwise be ingested
into large language models or generative AI offerings without OpenStax's prior written permission", under
CC BY-NC-SA. Feeding that text to the tutor would break those terms.

## Decision
Quote muscle actions from Gray's Anatomy of the Human Body, 20th ed., 1918 (public domain in the US; archive.org
OCR text). `facts.test.ts` fails if any source's licence field contains an AI-use prohibition. Every quote is
verbatim and at most 25 words, checked by two independent reviews.

## Consequences
- 1918 wording; the paraphrases flag dated terms (plantar flexion called "extension").
- Quotes match OCR text, not page images.
- A purchased textbook can be added later as another `kind: "textbook"` source, but its AI-use terms must be read first.

## Alternatives rejected
- **OpenStax:** terms forbid ingestion into AI offerings without written permission.
- **Ask OpenStax for permission:** may not arrive before the hackathon.
- **Wikipedia (CC BY-SA):** not a primary source and changes over time.
- **Keep OpenStax but hide it from the AI:** the tutor could not then explain what a muscle does.
