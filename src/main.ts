import { MUSCLE_BY_ID, MUSCLES } from "./muscle-map";
import { createViewer, type AtlasApi } from "./viewer";
import { renderGuide, renderSources } from "./panel";
import { createSidePanel } from "./side-panel";
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

  const side = $("side"), rail = $("rail"), clearBtn = $<HTMLButtonElement>("clear");
  const sidePanel = createSidePanel(side);
  const mixerList = $<HTMLUListElement>("mixer-list");
  const mixerCount = $("mixer-count"), mixerMatchText = $("mixer-matches");
  const mixerAsk = $<HTMLButtonElement>("mixer-ask"), mixerClear = $<HTMLButtonElement>("mixer-clear");
  const viewControls = $("view-controls");
  const mixerSection = $<HTMLDetailsElement>("muscle-mixer");
  const sources = $("sources");
  const chatPanel = $("chat-panel");
  let current: string | null = null;
  const mixed = new Set<string>();
  const callouts = createCallouts($("stage"), [side, rail, viewControls, $("brand"), sources, chatPanel]);
  atlas.onFrame((frame) => callouts.update(mixed.size ? null : frame));
  renderGuide($("guide-body"));
  renderSources($("sources-body"));
  $("zoom-in").addEventListener("click", atlas.zoomIn);
  $("zoom-out").addEventListener("click", atlas.zoomOut);
  $("reset-view").addEventListener("click", atlas.resetView);
  const railSections = [...rail.querySelectorAll<HTMLDetailsElement>(":scope > details")];  // guide and Mixer: an accordion of two
  for (const section of railSections) section.addEventListener("toggle", () => {
    if (section.open) for (const other of railSections) if (other !== section) other.open = false;
  });

  const applyHighlight = () => {
    const ids = mixed.size ? [...mixed] : current ? [current] : [];
    if (ids.length) atlas.highlight(ids); else atlas.clear();
  };
  let chatOpen = false;
  const syncSide = () => {
    side.hidden = current === null;  // details panel: needs a selection (the Mixer clears it); stays visible beside an open chat
    document.body.classList.toggle("idle", !chatOpen && current === null && mixed.size === 0);  // landing hint
  };
  const showCurrent = (id: string | null, focus: boolean) => {
    if (id !== current) {
      current = id;
      if (id !== null && focus) atlas.focus(id);
      sidePanel.show(id);
      syncSide();
      clearBtn.disabled = id === null;
      selectedEl.textContent = id === null ? "Selection cleared" : `Selected: ${MUSCLE_BY_ID[id].label}`;
      buttons.forEach((b, bid) => b.setAttribute("aria-pressed", String(bid === id)));
    }
    atlas.preview(null);
  };
  const renderMixer = () => {
    const ids = [...mixed];
    mixerCount.textContent = `${ids.length} selected`;
    mixerCount.classList.toggle("on", ids.length > 0);
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
    syncSide();
    if (ids.length) selectedEl.textContent = `Mixer: ${ids.map((id) => MUSCLE_BY_ID[id].label).join(", ")}`;
  };
  const toggleMixer = (id: string) => {
    const enteringMixer = mixed.size === 0;
    if (mixed.has(id)) mixed.delete(id); else mixed.add(id);
    if (enteringMixer && mixed.size) { showCurrent(null, false); mixerSection.open = true; }  // reveal "Ask AI"
    renderMixer();
    syncSide();
    applyHighlight();
  };
  const select = (id: string | null) => {
    if (mixed.size) {
      mixed.clear();
      renderMixer();
    }
    showCurrent(id, true);
    applyHighlight();
  };

  for (const m of MUSCLES) {
    const li = document.createElement("li");
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = m.label;
    b.title = m.label;
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
  const fade = () => list.classList.toggle("more", list.scrollHeight - list.scrollTop - list.clientHeight > 2);
  list.addEventListener("scroll", fade);
  addEventListener("resize", fade);
  for (const section of railSections) section.addEventListener("toggle", fade);
  fade();
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
    onOpenChange: (open) => { chatOpen = open; syncSide(); },
    hooks: {
      focus: (id) => atlas.focus(id),
      resetView: () => atlas.resetView(),
      show: (ids) => {
        if (ids.length <= 1) return select(ids[0] ?? null);
        mixed.clear();
        for (const id of ids) mixed.add(id);
        showCurrent(null, false);
        renderMixer();
        mixerSection.open = true;
        syncSide();
        applyHighlight();
        atlas.resetView();  // front and back muscles both in frame
      },
    },
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
      if (!sidePanel.closePopover()) select(null);  // the popover closes first, then the selection clears
    }
  });

  const tip = $("tip"), stage = $("stage");
  let partName: string | null = null;  // set by onPartHover (fires before onHover each tick): a part of the selected multi-part muscle
  atlas.onPartHover((part) => { partName = part ? part.name : null; });
  atlas.onHover((id, x, y) => {
    tip.classList.toggle("show", id !== null);  // fades out keeping its old label; a new label is set before the next fade-in
    if (id === null) return;
    tip.textContent = partName ?? MUSCLE_BY_ID[id].label;
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
  loading.classList.add("done");  // fades out (CSS), then stays invisible and inert
  document.body.classList.remove("loading");
}
