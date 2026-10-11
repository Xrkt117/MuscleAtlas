import { describe, expect, it } from "vitest";
import worker from "./index.js";

const allowedOrigin = "http://localhost:5173";
const request = (body, origin = allowedOrigin) => new Request("https://worker.example/chat", {
  method: "POST",
  headers: { "content-type": "application/json", origin },
  body: JSON.stringify(body),
});

describe("MuscleAtlas AI worker", () => {
  it("answers an allowed CORS preflight without a body", async () => {
    const response = await worker.fetch(new Request("https://worker.example/chat", {
      method: "OPTIONS",
      headers: { origin: allowedOrigin },
    }), { ALLOWED_ORIGINS: allowedOrigin });
    expect(response.status).toBe(204);
    expect(await response.text()).toBe("");
    expect(response.headers.get("access-control-allow-origin")).toBe(allowedOrigin);
  });

  it("rejects an unlisted browser origin", async () => {
    const response = await worker.fetch(request({ messages: [] }, "https://attacker.example"), { ALLOWED_ORIGINS: allowedOrigin });
    expect(response.status).toBe(403);
  });

  it("does not call OpenAI when the server secret is missing", async () => {
    const response = await worker.fetch(request({ messages: [{ role: "user", content: "Hello" }] }), { ALLOWED_ORIGINS: allowedOrigin });
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ error: "AI service is not configured." });
  });
});
