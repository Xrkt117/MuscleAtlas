import { MUSCLE_BY_ID, MUSCLES } from "./muscle-map";
import { createViewer, type AtlasApi } from "./viewer";
import { renderPanel } from "./panel";
import { createCallouts } from "./callouts";
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

  const info = $("info"), rail = $("rail"), pill = $<HTMLButtonElement>("rail-pill"), railCurrent = $("rail-current"), listCard = $("listcard");
  const callouts = createCallouts($("stage"), [info, rail, listCard, pill, $("credits")]);
  atlas.onFrame(callouts.update);
  renderPanel(info, null);

  // List rail: "open" on load, "collapsed" pill after the first selection, "overlay" when reopened.
  type RailState = "open" | "collapsed" | "overlay";
  let railState: RailState = "open", suppressFocusOpen = false, focusOpenedAt = 0;
  const setRail = (st: RailState) => {
    railState = st;
    rail.dataset.state = st;
    pill.setAttribute("aria-expanded", String(st !== "collapsed"));
  };
  const closeOverlay = (refocus: boolean) => {
    const hadFocus = rail.contains(document.activeElement);
    setRail("collapsed");
    if (refocus && hadFocus) { suppressFocusOpen = true; pill.focus(); suppressFocusOpen = false; }
  };
  const openOverlay = () => { if (railState === "collapsed") setRail("overlay"); };
  pill.addEventListener("focus", () => { if (!suppressFocusOpen && railState === "collapsed") { focusOpenedAt = performance.now(); openOverlay(); } });
  pill.addEventListener("click", () => {
    if (railState === "collapsed") openOverlay();
    else if (railState === "overlay" && performance.now() - focusOpenedAt > 400) closeOverlay(true);  // the click that follows a focus-open must not close it
  });
  rail.addEventListener("focusout", (e) => {
    const to = e.relatedTarget as Node | null;
    if (railState === "overlay" && to && !rail.contains(to)) setRail("collapsed");
  });
  addEventListener("pointerdown", (e) => { if (railState === "overlay" && !rail.contains(e.target as Node)) setRail("collapsed"); });

  const select = (id: string | null) => {
    if (id === null) {
      atlas.clear();
    } else {
      atlas.highlight([id]);
      atlas.focus(id);
    }
    renderPanel(info, id);
    callouts.show(id);
    railCurrent.textContent = id === null ? "" : MUSCLE_BY_ID[id].label;
    if (railState === "overlay") closeOverlay(true);
    else if (railState === "open" && id !== null) setRail("collapsed");
    selectedEl.textContent = id === null ? "" : `Selected: ${MUSCLE_BY_ID[id].label}`;
    buttons.forEach((b, bid) => b.setAttribute("aria-pressed", String(bid === id)));
  };

  for (const m of MUSCLES) {
    const li = document.createElement("li");
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = m.label;
    b.setAttribute("aria-pressed", "false");
    b.addEventListener("click", () => select(m.id));
    for (const ev of ["mouseenter", "focus"]) b.addEventListener(ev, () => atlas.preview(m.id));
    for (const ev of ["mouseleave", "blur"]) b.addEventListener(ev, () => atlas.preview(null));
    li.appendChild(b);
    list.appendChild(li);
    buttons.set(m.id, b);
  }
  $("clear").addEventListener("click", () => select(null));
  // Click on empty space or an unmapped muscle deselects, same as Esc.
  atlas.onSelect(select);
  addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if (railState === "overlay") closeOverlay(true); else select(null);  // Esc with the card open only closes the card
    } else if ((e.key === "m" || e.key === "M") && !e.ctrlKey && !e.metaKey && !e.altKey) {
      if (railState === "collapsed") { openOverlay(); ((listCard.querySelector('button[aria-pressed="true"]') ?? listCard.querySelector("button")) as HTMLButtonElement | null)?.focus(); }
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
} finally {
  loading.style.display = "none";
  document.body.classList.remove("loading");
}
