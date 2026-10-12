import { executeTool, summarizeResult, trimHistory, type AgentHooks, type Item } from "./agent-tools";
import { getSources } from "./facts";

interface ChatElements {
  launch: HTMLButtonElement;
  panel: HTMLElement;
  close: HTMLButtonElement;
  messages: HTMLElement;
  status: HTMLElement;
  form: HTMLFormElement;
  input: HTMLTextAreaElement;
  send: HTMLButtonElement;
  selectedMuscle: () => string | null;
  mixedMuscles: () => string[];
  hooks: AgentHooks;
  onOpenChange?: (open: boolean) => void;
}

interface ChatTurn { role: "user" | "assistant"; content: string }
const MAX_STEPS = 8;
const VISUAL_TOOLS = new Set(["show_muscles", "focus_camera", "reset_view"]);
const short = (v: unknown) => { const t = typeof v === "string" ? v : JSON.stringify(v); return t.length > 40 ? `${t.slice(0, 39)}…` : t; };
export interface ChatbotApi { open(prompt?: string): void }

const endpoint = import.meta.env.VITE_CHAT_API_URL?.trim();
const sourceUrls = new Map<string, string>([
  ["model-z-anatomy", "https://www.z-anatomy.com/"] as const,
  ["model-bodyparts3d", "https://lifesciencedb.jp/bp3d/"] as const,
  ...getSources().map((source) => [source.id, source.url] as const),
]);

function appendCitedText(root: HTMLElement, text: string): void {
  const citePattern = /\[([a-z0-9-]+)\]/gi;
  let cursor = 0;
  for (const match of text.matchAll(citePattern)) {
    const index = match.index ?? 0;
    root.append(document.createTextNode(text.slice(cursor, index)));
    const url = sourceUrls.get(match[1]);
    root.append(url
      ? Object.assign(document.createElement("a"), { href: url, textContent: match[0], target: "_blank", rel: "noopener noreferrer" })
      : document.createTextNode(match[0]));
    cursor = index + match[0].length;
  }
  root.append(document.createTextNode(text.slice(cursor)));
}

function addMessage(root: HTMLElement, role: ChatTurn["role"], content: string): void {
  const article = document.createElement("article");
  article.className = `chat-message ${role}`;
  article.setAttribute("aria-label", role === "assistant" ? "MuscleAtlas AI" : "You");
  appendCitedText(article, content);
  root.append(article);
  root.scrollTop = root.scrollHeight;
}

function addTrace(root: HTMLElement, name: string, argsJson: string): HTMLElement {
  let args = "";
  try { args = Object.values(JSON.parse(argsJson || "{}") as Record<string, unknown>).map(short).join(", "); } catch { /* shown as empty */ }
  const line = document.createElement("div");
  line.className = "chat-trace";
  line.textContent = `${VISUAL_TOOLS.has(name) ? "🎯" : "🔍"} ${name}(${args})`;
  root.append(line);
  root.scrollTop = root.scrollHeight;
  return line;
}

const outputText = (items: Item[]): string => items
  .filter((it) => it.type === "message")
  .flatMap((it) => (it.content as { type?: string; text?: string }[] | undefined) ?? [])
  .filter((part) => part.type === "output_text" && part.text)
  .map((part) => part.text)
  .join("\n\n");

/** Wire the source-grounded chat UI. The API key never enters this browser bundle. */
export function createChatbot(elements: ChatElements): ChatbotApi {
  let input: Item[] = [];  // whole conversation: user messages, model output items, tool outputs
  const setOpen = (open: boolean) => {
    elements.panel.hidden = !open;
    elements.launch.setAttribute("aria-expanded", String(open));
    elements.onOpenChange?.(open);
    if (open) requestAnimationFrame(() => elements.input.focus());
    else elements.launch.focus();
  };

  elements.launch.addEventListener("click", () => setOpen(elements.panel.hasAttribute("hidden")));
  elements.close.addEventListener("click", () => setOpen(false));
  elements.panel.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      setOpen(false);
    }
  });

  addMessage(elements.messages, "assistant", "Give me a goal: “Build a 30-minute dumbbell push workout and show me what it trains”, or “Which exercises hit chest and triceps together?” I'll look up cited facts, show the muscles on the model, and explain.");

  const chips = document.createElement("div");
  chips.className = "chat-chips";
  const chipButtons = ([
    ["30-min push workout", "Build a 30-minute dumbbell push workout and show me what it trains"],
    ["Chest + triceps together", "Which exercises hit chest and triceps together?"],
    ["Train my back", "Show me the muscles of my back and how to train them"],
  ] as const).map(([label, goal]) => {
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = label;
    b.addEventListener("click", () => { elements.input.value = goal; elements.form.requestSubmit(); });
    chips.append(b);
    return b;
  });
  elements.messages.append(chips);
  const setBusy = (busy: boolean) => { elements.status.classList.toggle("busy", busy); elements.send.disabled = busy; for (const b of chipButtons) b.disabled = busy; };
  elements.input.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.shiftKey && !event.isComposing) { event.preventDefault(); elements.form.requestSubmit(); }
  });

  elements.form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const content = elements.input.value.trim();
    if (!content || elements.send.disabled) return;
    if (!endpoint) {
      elements.status.textContent = "AI is not connected yet. Add VITE_CHAT_API_URL to the site build after deploying the included server proxy.";
      return;
    }

    input.push({ type: "message", role: "user", content });
    addMessage(elements.messages, "user", content);
    elements.input.value = "";
    setBusy(true);

    const selected = elements.selectedMuscle(), mixed = elements.mixedMuscles();
    const context = `Selected: ${selected ?? "none"}. Mixer: ${mixed.length ? mixed.join(", ") : "none"}.`;
    try {
      for (let step = 1; step <= MAX_STEPS + 1; step++) {
        const last = step > MAX_STEPS;
        if (last) input.push({ type: "message", role: "user", content: "Step limit reached: answer now with what you have, no more tool calls." });
        elements.status.textContent = `Thinking… (step ${step})`;
        input = trimHistory(input);
        const controller = new AbortController();
        const timeout = window.setTimeout(() => controller.abort(), 45_000);
        let output: Item[];
        try {
          const response = await fetch(endpoint, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ input, context }),
            signal: controller.signal,
          });
          const result = await response.json() as { output?: Item[]; error?: string };
          if (!response.ok || !result.output) throw new Error(result.error || `Request failed (${response.status})`);
          output = result.output;
        } finally {
          window.clearTimeout(timeout);
        }
        input.push(...output);
        const calls = output.filter((it) => it.type === "function_call");
        if (!calls.length) {
          const text = outputText(output);
          if (text) addMessage(elements.messages, "assistant", text);
          elements.status.textContent = "";
          return;
        }
        if (last) {
          elements.status.textContent = "The agent kept calling tools after the step limit. Please try a narrower goal.";
          return;
        }
        for (const call of calls) {
          const name = String(call.name), argsJson = String(call.arguments ?? "");
          const line = addTrace(elements.messages, name, argsJson);
          const result = await executeTool(name, argsJson, elements.hooks);
          const summary = summarizeResult(name, result);
          line.textContent += ` → ${summary}`;
          line.classList.toggle("error", summary.startsWith("error:"));
          input.push({ type: "function_call_output", call_id: call.call_id, output: JSON.stringify(result) });
        }
      }
    } catch (error) {
      elements.status.textContent = error instanceof DOMException && error.name === "AbortError"
        ? "The response took too long. Please try again."
        : `Could not reach MuscleAtlas AI: ${error instanceof Error ? error.message : "unknown error"}`;
    } finally {
      setBusy(false);
      elements.input.focus();
    }
  });

  return {
    open(prompt) {
      setOpen(true);
      if (prompt) {
        elements.input.value = prompt;
        elements.input.setSelectionRange(prompt.length, prompt.length);
      }
    },
  };
}
