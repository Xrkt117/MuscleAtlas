import { MUSCLE_BY_ID, MUSCLES } from "./muscle-map";
import { getEvidence, getFacts, getGuide, getSources } from "./facts";
import { mixerMatches } from "./mixer";

export interface AgentHooks {
  show(ids: string[]): void;
  focus(id: string): void;
  resetView(): void;
}

/** Tool names. The worker holds the twin JSON schemas: keep in sync with worker/src/index.js. */
export const AGENT_TOOL_NAMES = [
  "list_muscles",
  "get_muscle_facts",
  "get_training_guide",
  "find_exercises",
  "show_muscles",
  "focus_camera",
  "reset_view",
] as const;

const MAX_EXERCISES = 15;
let pauseMs = 500;
/** Camera-animation pause after visual tools; tests set 0. */
export const setAgentPause = (ms: number): void => {
  pauseMs = ms;
};
const pause = () => (pauseMs > 0 ? new Promise<void>((r) => setTimeout(r, pauseMs)) : Promise.resolve());

class ToolError extends Error {}

const checkId = (id: unknown): string => {
  if (typeof id !== "string" || !MUSCLE_BY_ID[id]) {
    throw new ToolError(`unknown muscle id '${String(id)}'. Call list_muscles for valid ids.`);
  }
  return id;
};

const checkIds = (ids: unknown, allowEmpty = false): string[] => {
  if (!Array.isArray(ids) || (!ids.length && !allowEmpty)) throw new ToolError("expected a non-empty array of muscle ids.");
  return ids.map(checkId);
};

export async function executeTool(name: string, argsJson: string, hooks: AgentHooks): Promise<unknown> {
  try {
    let args: Record<string, unknown>;
    try {
      args = argsJson?.trim() ? JSON.parse(argsJson) : {};
    } catch {
      throw new ToolError("arguments are not valid JSON.");
    }
    if (!args || typeof args !== "object") throw new ToolError("arguments must be a JSON object.");

    switch (name) {
      case "list_muscles":
        return MUSCLES.map(({ id, label }) => ({ id, label }));
      case "get_muscle_facts": {
        const id = checkId(args.id);
        const { actions, exercises } = getFacts(id);
        return { id, label: MUSCLE_BY_ID[id].label, actions, exercises };
      }
      case "get_training_guide":
        return {
          guide: getGuide(),
          evidence: getEvidence(),
          sources: getSources().map(({ id, title, url }) => ({ id, title, url })),
        };
      case "find_exercises": {
        const matches = mixerMatches(checkIds(args.muscle_ids));
        return { total: matches.length, exercises: matches.slice(0, MAX_EXERCISES) };
      }
      case "show_muscles": {
        const ids = checkIds(args.ids, true);
        hooks.show(ids);
        await pause();
        return { shown: ids.map((id) => MUSCLE_BY_ID[id].label) };
      }
      case "focus_camera": {
        const id = checkId(args.id);
        hooks.focus(id);
        await pause();
        return { focused: MUSCLE_BY_ID[id].label };
      }
      case "reset_view":
        hooks.resetView();
        await pause();
        return { ok: true };
      default:
        throw new ToolError(`unknown tool '${name}'. Available: ${AGENT_TOOL_NAMES.join(", ")}.`);
    }
  } catch (e) {
    return { error: e instanceof Error ? e.message : String(e) };
  }
}

/** Short text for the step trace in the chat UI. */
export function summarizeResult(name: string, result: unknown): string {
  const r = result as Record<string, unknown> | unknown[] | null;
  if (r && !Array.isArray(r) && typeof r.error === "string") return `error: ${r.error}`;
  if (Array.isArray(r)) return `${r.length} muscles`;
  if (!r) return "done";
  if (name === "get_muscle_facts") return `${(r.exercises as unknown[]).length} exercises`;
  if (name === "find_exercises") return `${r.total} exercises`;
  if (name === "get_training_guide") return "training guide";
  if (name === "show_muscles") return (r.shown as string[]).length ? `showing ${(r.shown as string[]).join(", ")}` : "cleared highlight";
  if (name === "focus_camera") return `focused ${r.focused}`;
  return "done";
}

export type Item = Record<string, unknown>;
const isUserMsg = (it: Item) => it.type === "message" && it.role === "user";
/** Drop the oldest whole turns (a turn starts at a user message) until at most `max` items remain. */
export function trimHistory(items: Item[], max = 140): Item[] {
  let out = items;
  while (out.length > max) {
    const i = out.findIndex((it, k) => k > 0 && isUserMsg(it));
    if (i < 0) break;
    out = out.slice(i);
  }
  return out;
}
