# Implementation Report: Viewer (PRD phase 2)

## Summary
Tasks 1-10 were implemented by a Sonnet agent. The main session re-ran typecheck, tests and build, read
`src/viewer.ts`, and did task 11 (real-browser check, screenshots read) itself.

## Validation (main session, re-run)
| Check | Result |
|---|---|
| `npm run typecheck` | exit 0 |
| `npm test` | 8 passed, 0 failed |
| `npm run build` | succeeds; warning: JS chunk 588 kB (over 500 kB) |
| Browser, headless Chrome (dev server) | renders; 47 fps; load 12 s |
| Browser, headed Chrome window (dev server) | 50 fps; load 12.7 s; Apple M5 |
| Highlight (lats, biceps), list click, "Selected" label | seen in screenshots |
| Canvas click | chest gives `pectoralis_major`; corner gives null; orbit drag gives no pick |
| Unknown id | throws `Unknown muscle id: nope` |
| Console errors | only a 404 for `favicon.ico` (no favicon exists) |

## Deviations
- Vitest 4.1.11, not 5.0.3 (5.x requires Node ^22.12 || ^24 || >=26; this machine runs 25.2.1).
- A `@ts-expect-error` above the `node:fs` import in the test, to avoid adding `@types/node`.
- `tsconfig.json` also has `types: ["vite/client"]` and `skipLibCheck`.

## Unchecked
- The owner's own hand check of the page.
- The production build served by `vite preview` in a browser, and its load time.
- The load-failure banner on a real failure, window resize, hidden-tab behaviour.

## Follow-ups
- `focus` keeps the viewing direction, so back muscles (lats) are seen through the dimmed body from the
  front. Turn the camera to the muscle's side.
- Deep muscles cannot be clicked (superficial ones are hit first).
- 12 s dev load: check the production build and consider smaller meshes.
- Add a favicon; consider code-splitting for the 588 kB chunk.
