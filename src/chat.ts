import { buildChatKnowledge } from "./chat-context";
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
}

interface ChatTurn { role: "user" | "assistant"; content: string }
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

/** Wire the source-grounded chat UI. The API key never enters this browser bundle. */
export function createChatbot(elements: ChatElements): ChatbotApi {
  const history: ChatTurn[] = [];
  const setOpen = (open: boolean) => {
    elements.panel.hidden = !open;
    elements.launch.setAttribute("aria-expanded", String(open));
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

  addMessage(elements.messages, "assistant", "Ask about a muscle, compare exercise options, or build a cited hypertrophy program. To use the Mixer, close chat and right-click several muscles in the list or on the model; then reopen chat and ask for exercises that cover the full mix.");

  elements.form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const content = elements.input.value.trim();
    if (!content || elements.send.disabled) return;
    if (!endpoint) {
      elements.status.textContent = "AI is not connected yet. Add VITE_CHAT_API_URL to the site build after deploying the included server proxy.";
      return;
    }

    const userTurn: ChatTurn = { role: "user", content };
    history.push(userTurn);
    addMessage(elements.messages, "user", content);
    elements.input.value = "";
    elements.status.textContent = "Thinking…";
    elements.send.disabled = true;

    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 45_000);
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          messages: history.slice(-10),
          knowledge: buildChatKnowledge(elements.selectedMuscle(), elements.mixedMuscles()),
        }),
        signal: controller.signal,
      });
      const result = await response.json() as { text?: string; error?: string };
      if (!response.ok || !result.text) throw new Error(result.error || `Request failed (${response.status})`);
      const assistantTurn: ChatTurn = { role: "assistant", content: result.text };
      history.push(assistantTurn);
      addMessage(elements.messages, "assistant", assistantTurn.content);
      elements.status.textContent = "";
    } catch (error) {
      const message = error instanceof DOMException && error.name === "AbortError"
        ? "The response took too long. Please try again."
        : `Could not reach MuscleAtlas AI: ${error instanceof Error ? error.message : "unknown error"}`;
      elements.status.textContent = message;
    } finally {
      window.clearTimeout(timeout);
      elements.send.disabled = false;
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
