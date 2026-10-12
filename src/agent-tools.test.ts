import { beforeAll, describe, expect, it, vi } from "vitest";
import { AGENT_TOOL_NAMES, executeTool, setAgentPause, summarizeResult, trimHistory, type AgentHooks } from "./agent-tools";
import { MUSCLES } from "./muscle-map";

const hooks = (): AgentHooks => ({ show: vi.fn(), focus: vi.fn(), resetView: vi.fn() });
const run = (name: string, args: unknown, h = hooks()) => executeTool(name, JSON.stringify(args), h);

beforeAll(() => setAgentPause(0));

describe("executeTool", () => {
  it("lists every muscle", async () => {
    const r = (await run("list_muscles", {})) as { id: string }[];
    expect(r.map((m) => m.id)).toEqual(MUSCLES.map((m) => m.id));
  });

  it("returns cited facts, guide and exercise matches", async () => {
    const facts = (await run("get_muscle_facts", { id: "pectoralis_major" })) as { actions: unknown[]; exercises: unknown[] };
    expect(facts.actions.length).toBeGreaterThan(0);
    expect(facts.exercises.length).toBeGreaterThan(0);

    const guide = (await run("get_training_guide", {})) as { guide: unknown[]; sources: { id: string }[] };
    expect(guide.guide.length).toBeGreaterThan(0);
    expect(guide.sources.length).toBeGreaterThan(0);

    const found = (await run("find_exercises", { muscle_ids: ["pectoralis_major"] })) as { total: number; exercises: unknown[] };
    expect(found.total).toBeGreaterThan(0);
    expect(found.exercises.length).toBeLessThanOrEqual(15);
  });

  it("drives the hooks for visual tools", async () => {
    const h = hooks();
    const shown = (await run("show_muscles", { ids: ["deltoid", "triceps_brachii"] }, h)) as { shown: string[] };
    expect(shown.shown).toHaveLength(2);
    expect(h.show).toHaveBeenCalledWith(["deltoid", "triceps_brachii"]);
    expect(await run("focus_camera", { id: "deltoid" }, h)).toEqual({ focused: expect.any(String) });
    expect(h.focus).toHaveBeenCalledWith("deltoid");
    expect(await run("reset_view", {}, h)).toEqual({ ok: true });
    expect(h.resetView).toHaveBeenCalled();
  });

  it("show_muscles with an empty list clears; find_exercises rejects empty", async () => {
    const h = hooks();
    expect(await run("show_muscles", { ids: [] }, h)).toEqual({ shown: [] });
    expect(h.show).toHaveBeenCalledWith([]);
    expect(await run("find_exercises", { muscle_ids: [] }, h)).toEqual({ error: expect.any(String) });
  });

  it("errors on unknown ids without calling hooks", async () => {
    const h = hooks();
    for (const [name, args] of [
      ["get_muscle_facts", { id: "biceps" }],
      ["show_muscles", { ids: ["deltoid", "biceps"] }],
      ["focus_camera", { id: "biceps" }],
      ["find_exercises", { muscle_ids: ["biceps"] }],
    ] as const) {
      const r = (await run(name, args, h)) as { error: string };
      expect(r.error).toContain("unknown muscle id 'biceps'");
      expect(r.error).toContain("list_muscles");
    }
    expect(h.show).not.toHaveBeenCalled();
    expect(h.focus).not.toHaveBeenCalled();
  });

  it("never throws: unknown tool, bad JSON, throwing hook", async () => {
    expect(await run("nope", {})).toEqual({ error: expect.stringContaining("unknown tool 'nope'") });
    expect(await executeTool("focus_camera", "{oops", hooks())).toEqual({ error: expect.stringContaining("JSON") });
    const h = { ...hooks(), focus: () => { throw new Error("boom"); } };
    expect(await run("focus_camera", { id: "deltoid" }, h)).toEqual({ error: "boom" });
  });

  it("exports all seven tool names", () => {
    expect(AGENT_TOOL_NAMES).toHaveLength(7);
  });
});

describe("summarizeResult", () => {
  it("summarizes errors and lists", () => {
    expect(summarizeResult("focus_camera", { error: "unknown muscle id 'biceps'." })).toBe("error: unknown muscle id 'biceps'.");
    expect(summarizeResult("list_muscles", [{ id: "a" }, { id: "b" }])).toBe("2 muscles");
    expect(summarizeResult("find_exercises", { total: 4, exercises: [] })).toBe("4 exercises");
  });
});

describe("trimHistory", () => {
  it("drops oldest whole turns, never splitting a call from its output", () => {
    const u = (n: number) => ({ type: "message", role: "user", content: `q${n}` });
    const turn = (n: number) => [u(n), { type: "function_call", call_id: `c${n}` }, { type: "function_call_output", call_id: `c${n}` }, { type: "message", role: "assistant" }];
    const items = [...turn(1), ...turn(2), ...turn(3)];
    const out = trimHistory(items, 9);
    expect(out).toHaveLength(8);
    expect(out[0]).toEqual(u(2));
    expect(trimHistory(items, 100)).toBe(items);
    expect(trimHistory(turn(1), 2)).toHaveLength(4);
  });
});
