import { MUSCLE_BY_ID, MUSCLES } from "./muscle-map";
import { createViewer, type AtlasApi } from "./viewer";
import { renderGuide, renderPanel, renderSources } from "./panel";
import { createCallouts } from "./callouts";
import { createChatbot } from "./chat";
import { mixerMatches } from "./mixer";
import "./style.css";

declare global {
  interface Window { atlas: AtlasApi }
}

const $ = <T extends HTMLElement>(id: string): T => {
  const el = document.getElementById(id);
  if (!el) throw new Error(`#${id} missing from index.html`);
  return el as T;
};
const list = $<HTMLUListElement>("list");
const selectedEl = $("selected");
const buttons = new Map<string, HTMLButtonElement>();

const loading = $("loading"), loadingText = $("loading-text"), loadingBar = $<HTMLProgressElement>("loading-bar");
try {
  const atlas = await createViewer($("stage"), (f) => {
    loadingText.textContent = f === null ? "Loading model..." : `Loading model... ${Math.round(f * 100)}%`;
    if (f === null) loadingBar.removeAttribute("value"); else loadingBar.value = f;
  });
  window.atlas = atlas;

  const info = $("info"), rail = $("rail"), railCurrent = $("rail-current"), listCard = $("listcard");
  const musclesSection = $<HTMLDetailsElement>("muscles-section");
  const mixerList = $<HTMLUListElement>("mixer-list");
  const mixerCount = $("mixer-count"), mixerMatchText = $("mixer-matches");
  const mixerAsk = $<HTMLButtonElement>("mixer-ask"), mixerClear = $<HTMLButtonElement>("mixer-clear");
  const viewControls = $("view-controls");
  const sources = $("sources");
  const chatPanel = $("chat-panel");
  const callouts = createCallouts($("stage"), [info, rail, viewControls, $("brand"), sources, chatPanel]);
  atlas.onFrame(callouts.update);
  renderPanel(info, null);
  renderGuide($("guide-body"));
  renderSources($("sources-body"));
  $("zoom-in").addEventListener("click", atlas.zoomIn);
  $("zoom-out").addEventListener("click", atlas.zoomOut);
  $("reset-view").addEventListener("click", atlas.resetView);
  const railSections = [...rail.querySelectorAll<HTMLDetailsElement>(":scope > details")];
  for (const section of railSections) section.addEventListener("toggle", () => {
    if (section.open) for (const other of railSections) if (other !== section) other.open = false;
  });

  let current: string | null = null;
  const mixed = new Set<string>();
  const applyHighlight = () => {
    const ids = mixed.size ? [...mixed] : current ? [current] : [];
    if (ids.length) atlas.highlight(ids); else atlas.clear();
  };
  const showCurrent = (id: string | null, focus: boolean) => {
    if (id !== current) {
      current = id;
      if (id !== null && focus) atlas.focus(id);
      renderPanel(info, id);
      railCurrent.textContent = id === null ? "" : MUSCLE_BY_ID[id].label;
      selectedEl.textContent = id === null ? "Selection cleared" : `Selected: ${MUSCLE_BY_ID[id].label}`;
      buttons.forEach((b, bid) => b.setAttribute("aria-pressed", String(bid === id)));
    }
    atlas.preview(null);
  };
  const renderMixer = () => {
    const ids = [...mixed];
    mixerCount.textContent = `${ids.length} selected`;
    mixerAsk.disabled = ids.length === 0;
    mixerClear.disabled = ids.length === 0;
    mixerList.replaceChildren(...ids.map((id) => {
      const item = document.createElement("li");
      const remove = document.createElement("button");
      remove.type = "button";
      remove.textContent = `${MUSCLE_BY_ID[id].label} ×`;
      remove.setAttribute("aria-label", `Remove ${MUSCLE_BY_ID[id].label} from Mixer`);
      remove.addEventListener("click", () => {
        mixed.delete(id);
        if (current === id) showCurrent(mixed.values().next().value ?? null, false);
        renderMixer();
        applyHighlight();
      });
      item.append(remove);
      return item;
    }));
    const matches = mixerMatches(ids);
    mixerMatchText.textContent = !ids.length
      ? "No muscles mixed yet."
      : matches.length
        ? `${matches.length} source-linked exercise${matches.length === 1 ? "" : "s"} cover the full mix.`
        : "No exact overlap exists in the current exercise source; the AI will not invent one.";
    buttons.forEach((button, id) => button.dataset.mixed = String(mixed.has(id)));
    if (ids.length) selectedEl.textContent = `Mixer: ${ids.map((id) => MUSCLE_BY_ID[id].label).join(", ")}`;
  };
  const toggleMixer = (id: string) => {
    if (mixed.has(id)) mixed.delete(id); else mixed.add(id);
    if (mixed.has(id)) showCurrent(id, true);
    else if (current === id) showCurrent(mixed.values().next().value ?? null, false);
    renderMixer();
    applyHighlight();
  };
  const select = (id: string | null) => {
    if (mixed.size) {
      mixed.clear();
      renderMixer();
    }
    showCurrent(id, true);
    applyHighlight();
    if (id !== null) musclesSection.open = false;
  };

  for (const m of MUSCLES) {
    const li = document.createElement("li");
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = m.label;
    b.setAttribute("aria-pressed", "false");
    b.addEventListener("click", () => select(m.id));
    b.addEventListener("contextmenu", (event) => { event.preventDefault(); toggleMixer(m.id); });
    b.addEventListener("keydown", (event) => {
      if (event.shiftKey && (event.key === "Enter" || event.key === " ")) {
        event.preventDefault();
        toggleMixer(m.id);
      }
    });
    for (const ev of ["mouseenter", "focus"]) b.addEventListener(ev, () => atlas.preview(m.id));
    for (const ev of ["mouseleave", "blur"]) b.addEventListener(ev, () => atlas.preview(null));
    li.appendChild(b);
    list.appendChild(li);
    buttons.set(m.id, b);
  }
  renderMixer();
  $("clear").addEventListener("click", () => select(null));
  const chat = createChatbot({
    launch: $<HTMLButtonElement>("chat-launch"),
    panel: chatPanel,
    close: $<HTMLButtonElement>("chat-close"),
    messages: $("chat-messages"),
    status: $("chat-status"),
    form: $<HTMLFormElement>("chat-form"),
    input: $<HTMLTextAreaElement>("chat-input"),
    send: $<HTMLButtonElement>("chat-send"),
    selectedMuscle: () => current,
    mixedMuscles: () => [...mixed],
  });
  mixerClear.addEventListener("click", () => {
    mixed.clear();
    showCurrent(null, false);
    renderMixer();
    applyHighlight();
  });
  mixerAsk.addEventListener("click", () => {
    const labels = [...mixed].map((id) => MUSCLE_BY_ID[id].label).join(", ");
    chat.open(`Using my Mixer selection (${labels}), find source-supported exercises that target every selected group. Explain primary versus secondary targeting and suggest a hypertrophy-focused sequence. If the current source has no exact overlap, say so rather than inventing one.`);
  });
  // Click on empty space or an unmapped muscle deselects, same as Esc.
  atlas.onSelect(select);
  atlas.onContextSelect((id) => { if (id) toggleMixer(id); });
  addEventListener("keydown", (e) => {
    if (e.repeat || (e.target instanceof Element && e.target.closest("input,textarea,select,[contenteditable]"))) return;
    if (e.key === "Escape") {
      if (musclesSection.open) {
        musclesSection.open = false;
        musclesSection.querySelector("summary")?.focus();
      } else select(null);
    } else if ((e.key === "m" || e.key === "M") && !e.ctrlKey && !e.metaKey && !e.altKey) {
      musclesSection.open = !musclesSection.open;
      if (musclesSection.open) requestAnimationFrame(() => ((listCard.querySelector('button[aria-pressed="true"]') ?? listCard.querySelector("button")) as HTMLButtonElement | null)?.focus());
    }
  });

  const tip = $("tip"), stage = $("stage");
  atlas.onHover((id, x, y) => {
    tip.classList.toggle("show", id !== null);  // fades out keeping its old label; a new label is set before the next fade-in
    if (id === null) return;
    tip.textContent = MUSCLE_BY_ID[id].label;
    const r = stage.getBoundingClientRect();
    tip.style.left = `${Math.max(0, Math.min(x - r.left + 12, r.width - tip.offsetWidth))}px`;
    tip.style.top = `${Math.max(0, Math.min(y - r.top + 12, r.height - tip.offsetHeight))}px`;
  });
} catch (err) {
  console.error("MuscleAtlas failed to load", err);
  const banner = $("error");
  banner.textContent = `Could not load the 3D model: ${err instanceof Error ? err.message : String(err)}`;
  banner.style.display = "block";
  document.body.classList.add("failed");
} finally {
  loading.style.display = "none";
  document.body.classList.remove("loading");
}
