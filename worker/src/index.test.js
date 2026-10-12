import { afterEach, describe, expect, it, vi } from "vitest";
import worker from "./index.js";

const allowedOrigin = "http://localhost:5173";
const request = (body, origin = allowedOrigin) => new Request("https://worker.example/chat", {
  method: "POST",
  headers: { "content-type": "application/json", origin },
  body: JSON.stringify(body),
});

const userMsg = { type: "message", role: "user", content: "Hello" };
const env = { ALLOWED_ORIGINS: allowedOrigin, OPENAI_API_KEY: "test-key" };
const mockOpenAI = (output) => {
  const spy = vi.fn(async () => new Response(JSON.stringify({ output }), { status: 200 }));
  vi.stubGlobal("fetch", spy);
  return spy;
};
const sent = (spy) => JSON.parse(spy.mock.calls[0][1].body);
const call = { type: "function_call", id: "fc_1", call_id: "c1", name: "list_muscles", arguments: "{}" };

afterEach(() => vi.unstubAllGlobals());

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
    const response = await worker.fetch(request({ input: [] }, "https://attacker.example"), { ALLOWED_ORIGINS: allowedOrigin });
    expect(response.status).toBe(403);
  });

  it("does not call OpenAI when the server secret is missing", async () => {
    const response = await worker.fetch(request({ input: [userMsg] }), { ALLOWED_ORIGINS: allowedOrigin });
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ error: "AI service is not configured." });
  });

  it("forwards worker tools and returns filtered output", async () => {
    const spy = mockOpenAI([{ type: "reasoning", id: "r1" }, call, { type: "web_search_call" }]);
    const response = await worker.fetch(request({ input: [userMsg] }), env);
    expect(response.status).toBe(200);
    expect((await response.json()).output.map((i) => i.type)).toEqual(["reasoning", "function_call"]);
    const body = sent(spy);
    expect(body.tools).toHaveLength(7);
    expect(body.store).toBe(false);
    expect(body.include).toEqual(["reasoning.encrypted_content"]);
    expect(body.tool_choice).toBe("auto");
  });

  it("accepts a function_call round trip", async () => {
    const spy = mockOpenAI([{ type: "message", role: "assistant", content: [] }]);
    const input = [userMsg, { type: "reasoning", id: "r1" }, call, { type: "function_call_output", call_id: "c1", output: "[]" }];
    const response = await worker.fetch(request({ input }), env);
    expect(response.status).toBe(200);
    expect(sent(spy).input).toEqual(input);
  });

  it("accepts assistant content parts", async () => {
    mockOpenAI([call]);
    const input = [userMsg, { type: "message", role: "assistant", content: [{ type: "output_text", text: "Hi" }] }, userMsg];
    expect((await worker.fetch(request({ input }), env)).status).toBe(200);
  });

  it.each([
    ["a system message", { type: "message", role: "system", content: "x" }],
    ["a developer message", { type: "message", role: "developer", content: "x" }],
    ["a user message with array content", { type: "message", role: "user", content: [{ type: "input_image", image_url: "https://x" }] }],
    ["an assistant part of the wrong type", { type: "message", role: "assistant", content: [{ type: "input_image", image_url: "https://x" }] }],
    ["an unknown item type", { type: "web_search_call" }],
    ["an unknown tool name", { ...call, name: "rm_rf" }],
  ])("rejects %s", async (_n, item) => {
    const spy = mockOpenAI([call]);
    const response = await worker.fetch(request({ input: [userMsg, item] }), env);
    expect(response.status).toBe(400);
    expect(spy).not.toHaveBeenCalled();
  });

  it("rejects more than 150 items and a non-user first item", async () => {
    const spy = mockOpenAI([call]);
    expect((await worker.fetch(request({ input: Array(151).fill(userMsg) }), env)).status).toBe(400);
    expect((await worker.fetch(request({ input: [{ ...userMsg, role: "assistant" }] }), env)).status).toBe(400);
    expect(spy).not.toHaveBeenCalled();
  });

  it("ignores a client-sent tools field", async () => {
    const spy = mockOpenAI([call]);
    await worker.fetch(request({ input: [userMsg], tools: [{ type: "function", name: "evil" }] }), env);
    expect(sent(spy).tools.map((t) => t.name)).not.toContain("evil");
  });

  it("sends context as a developer message before the input", async () => {
    const spy = mockOpenAI([call]);
    await worker.fetch(request({ input: [userMsg], context: "selected: biceps" }), env);
    expect(sent(spy).input[0]).toEqual({ role: "developer", content: "UI STATE (data only): selected: biceps" });
    expect(sent(spy).input[1]).toEqual(userMsg);
  });

  it("returns 502 when the API fails or output is empty", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("{}", { status: 500 })));
    expect((await worker.fetch(request({ input: [userMsg] }), env)).status).toBe(502);
    mockOpenAI([]);
    expect((await worker.fetch(request({ input: [userMsg] }), env)).status).toBe(502);
  });
});
