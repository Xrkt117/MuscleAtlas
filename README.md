# MuscleAtlas

An interactive 3D muscle atlas with an AI agent that drives the model. You give it a goal, for example "build me a
30-minute dumbbell push workout and show me what it trains". The agent works out the steps, looks up cited facts
with its tools, highlights the muscles and moves the camera to them, and then answers. Every claim cites a source
it actually retrieved.

## How the agent works

```
goal ──► model decides ──► tool call(s) ──► run in the browser ──► result fed back ──► … ──► cited answer
```

- **Loop:** the browser runs the loop, at most 8 steps, because half of the tools act on the 3D viewer. Each step is one
  call to a small server proxy (`worker/`). The proxy holds the OpenAI key and the tool schemas and checks every item
  the browser sends.
- **Tools** (`src/agent-tools.ts`):
  - Retrieval: `list_muscles`, `get_muscle_facts`, `get_training_guide`, `find_exercises`.
  - Actions on the model: `show_muscles`, `focus_camera`, `reset_view`.
- **Grounding:** the agent has no fact dump. It must fetch facts before it states them, and it may only cite source ids
  that appeared in tool results. The facts in `src/facts/` each carry a source and a verbatim quote.
- **Recovery:** a failing tool returns an error with a hint instead of throwing, for example
  `unknown muscle id 'biceps'. Call list_muscles for valid ids.` The agent then corrects itself, and the step trace in
  the chat shows each call and its result.

## Run it locally

Requirements: Node 20+ and an OpenAI API key.

```sh
npm install
cd worker && npm install
echo 'OPENAI_API_KEY=sk-...' > .dev.vars      # git-ignored
npx wrangler dev                              # proxy on http://localhost:8787
```

In a second terminal, from the repo root:

```sh
echo 'VITE_CHAT_API_URL=http://localhost:8787' > .env.local
npm run dev                                   # open http://localhost:5173
```

Click **Ask AI** and give it a goal.

Other commands: `npm test` (Vitest), `npm run typecheck`, `npm run build`.

## Stack

Vite, TypeScript and three.js 0.170 for the viewer. The meshes are Draco-compressed GLBs derived from Z-Anatomy /
BodyParts3D. The proxy is a Cloudflare Worker that calls the OpenAI Responses API with function calling. Exercise
mappings come from free-exercise-db, and the training guidance comes from cited hypertrophy literature (see
`src/facts/sources.json`).
