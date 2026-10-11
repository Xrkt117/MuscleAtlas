# MuscleAtlas AI setup

The site keeps the OpenAI API key in a small Cloudflare Worker. Never add the key to Vite, GitHub Pages, or any variable whose name starts with `VITE_`; those values are public browser code.

## 1. Deploy the server proxy

1. In `worker/wrangler.jsonc`, replace or extend `ALLOWED_ORIGINS` with the exact origin that hosts MuscleAtlas. Paths are not included in an origin.
2. From the `worker` directory, run `npm install`.
3. Run `npx wrangler secret put OPENAI_API_KEY` and enter a project-scoped OpenAI API key when prompted.
4. Run `npm run deploy` and copy the resulting `workers.dev` URL.

The worker uses the OpenAI Responses API, defaults to `gpt-6-luna`, limits request size and history, restricts browser origins, and sets `store: false`. Change `OPENAI_MODEL` in `wrangler.jsonc` if a different available text model is preferred.

## 2. Connect GitHub Pages

In the GitHub repository, create an Actions variable named `VITE_CHAT_API_URL` whose value is the Worker URL. Re-run the Pages workflow. This URL is public by design; the API key remains a Worker secret.

For local development, copy `.env.example` to `.env.local`, run the Worker with `npm run dev` from `worker`, and run the Vite app normally from the repository root.

## Mixer behavior

Right-click muscle entries or the 3D model to add or remove selections. The browser computes exact overlaps from the project's cited free-exercise-db primary and secondary regions. The AI receives those matches and is instructed not to invent an exercise when no exact overlap exists.
