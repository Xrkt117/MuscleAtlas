# 0008 — Agent loop in the browser, tools and key on the worker

**Date:** 2026-10-11
**Status:** accepted

## Context
The AIC "Agentic AI" hackathon (deadline 2026-10-12 00:00 EDT) judges an agent loop: goal, decide, use tools, observe, finish.
The chat sent the whole facts base each turn and got one text answer back. Half the useful tools act on the three.js viewer,
which exists only in the browser. The key must never reach the bundle.

## Decision
- The loop runs in `src/chat.ts`, at most 8 steps plus one forced final answer. Each step POSTs `{input, context}` to the worker and
  appends the returned Responses `output` items. Tools run in `src/agent-tools.ts` (`executeTool` never throws; errors come back as
  `{error}` with a hint, so the model recovers on its own).
- `worker/src/index.js` holds the OpenAI key and the 7 tool schemas (twin of `AGENT_TOOL_NAMES`). It validates every item: user
  content must be a string, assistant parts must be `output_text`, function calls must name one of our tools, and no system or
  developer roles are allowed. It caps the input at 150 items and 160 KB, and sends `store: false` with
  `include: ["reasoning.encrypted_content"]`.
- Retrieval replaces stuffing: the model gets facts only through `get_muscle_facts`, `get_training_guide`, `find_exercises` and
  `list_muscles`, and it cites only source ids that appeared in tool results.

## Consequences
The client can forge the conversation (including fake tool outputs), but that only affects its own answer. The tool schemas exist
twice (worker JS and client TS) and must be kept in sync by hand. Each step is a full round trip, with no streaming.

## Alternatives rejected
- Loop on the worker: it cannot drive the viewer, so it would need a second protocol for the visual actions.
- Keep sending the whole knowledge blob: it isn't retrieval, which costs on the "agentic" criterion, and it makes requests bigger.
- `previous_response_id` with `store: true`: it keeps conversation data at OpenAI, which the old proxy avoided on purpose.
