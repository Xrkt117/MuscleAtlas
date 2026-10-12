import { anatomyContent, h, original } from "./panel";
import { buildPanelModel, type PanelExercise } from "./facts/panel-model";
import { datasetGroups } from "./dataset-groups";
import { MUSCLE_BY_ID } from "./muscle-map";

const NO_EXERCISES = "No exercise mapping in the current source is specific enough for this muscle.";
const NOTE = "This is a dataset listing, not a ranking and not evidence of benefit. Dataset groups are broad regions, not individual muscle heads.";
const TABS = [{ key: "ex", label: "Overview" }, { key: "an", label: "Anatomy and evidence" }] as const;
type Key = (typeof TABS)[number]["key"];

/** The expandable part of a row: dataset groups, mechanic and kind, then the verbatim source quote. */
function exerciseMore(ex: PanelExercise): HTMLElement {
  const more = h("div", { class: "ex-more" });
  for (const [label, vals] of [["Primary", datasetGroups(ex.datasetPrimary)], ["Secondary", datasetGroups(ex.datasetSecondary)]] as const)
    if (vals.length) more.appendChild(h("p", { class: "det" }, `${label}: ${vals.join(", ")}`));
  more.appendChild(h("p", { class: "det" }, `${ex.mechanic === "isolation" ? "Isolation" : "Compound"} · ${ex.modality === "calisthenics" ? "Bodyweight" : "Weights, bands and machines"}`));
  more.appendChild(original(ex, ex.quote));
  return more;
}

/** One plain list for the tab (bodyweight first, then loaded): at most one row open. */
function exerciseList(exercises: PanelExercise[]): HTMLElement {
  const rows: HTMLButtonElement[] = [];
  const box = h("div", { class: "ex-list" });
  for (const ex of exercises) {
    const row = h("button", { type: "button", class: "ex", "aria-pressed": "false" }, ex.name) as HTMLButtonElement;
    row.addEventListener("click", () => {
      const next = row.getAttribute("aria-pressed") !== "true";
      rows.forEach((r) => r.setAttribute("aria-pressed", "false"));
      row.setAttribute("aria-pressed", String(next));
    });
    rows.push(row);
    box.append(row, exerciseMore(ex));
  }
  return box;
}

/**
 * Right-hand panel: muscle name, two tabs (Exercises, Anatomy and evidence). The active tab survives a change of muscle.
 */
export function createSidePanel(root: HTMLElement) {
  let active: Key = "ex";
  let noteBtn: HTMLButtonElement | null = null, noteTip: HTMLElement | null = null;
  const setNote = (open: boolean) => { if (noteBtn && noteTip) { noteTip.hidden = !open; noteBtn.setAttribute("aria-expanded", String(open)); } };
  addEventListener("pointerdown", (e) => {  // outside click closes the popover
    if (noteBtn && noteTip && !noteTip.hidden && !noteBtn.contains(e.target as Node)) setNote(false);
  });

  function exercisesPanel(id: string): HTMLElement[] {
    const m = buildPanelModel(id);
    const note = h("button", { type: "button", class: "note-btn", "aria-expanded": "false", "aria-describedby": "dataset-tip" }, "Dataset listing (i)") as HTMLButtonElement;
    const tip = h("div", { id: "dataset-tip", role: "tooltip", hidden: "" }, NOTE);
    noteBtn = note; noteTip = tip;
    note.addEventListener("click", () => setNote(true));
    note.addEventListener("mouseenter", () => setNote(true));
    note.addEventListener("focus", () => setNote(true));
    for (const ev of ["mouseleave", "blur"]) note.addEventListener(ev, () => setNote(false));
    return [
      h("section", { class: "fn" }, h("h3", { class: "sec-h" }, "What it does"),
        ...m.actions.map((a) => h("div", { class: "fn-item" }, h("p", null, a.text), h("p", { class: "cite" }, a.short)))),
      h("h3", { class: "sec-h" }, "How to train it"),
      h("div", { class: "row-h" }, h("span", { class: "empty-note" }, "Listed as in the dataset"), h("span", { class: "note-wrap" }, note, tip)),
      ...(m.exercises.length
        ? [exerciseList([...m.calisthenics, ...m.loadedExercises])]
        : [h("p", { class: "empty-note" }, NO_EXERCISES)]),
    ];
  }

  function show(id: string | null) {
    noteBtn = noteTip = null;
    if (id === null) { root.replaceChildren(); return; }
    const tabs = TABS.map((t) => h("button", {
      type: "button", role: "tab", id: `side-tab-${t.key}`, class: "tab", "aria-controls": `side-panel-${t.key}`,
    }, t.label) as HTMLButtonElement);
    const panels = {
      ex: h("div", { role: "tabpanel", id: "side-panel-ex", class: "tabpanel", "aria-labelledby": "side-tab-ex" }, ...exercisesPanel(id)),
      an: h("div", { role: "tabpanel", id: "side-panel-an", class: "tabpanel", "aria-labelledby": "side-tab-an" }, ...anatomyContent(id)),
    };
    const tablist = h("div", { role: "tablist", "aria-label": "Muscle details", class: "tabs" }, ...tabs);
    const place = () => {  // slide the underline under the active tab (runs on user action and when the panel gets a size)
      const t = tabs.find((b) => b.getAttribute("aria-selected") === "true");
      if (t) { tablist.style.setProperty("--ind-x", `${t.offsetLeft}px`); tablist.style.setProperty("--ind-w", `${t.offsetWidth}px`); }
    };
    const select = (k: Key, focus = false) => {
      active = k;
      TABS.forEach((t, i) => {
        const on = t.key === k;
        tabs[i].setAttribute("aria-selected", String(on));
        tabs[i].tabIndex = on ? 0 : -1;
        panels[t.key].hidden = !on;
        if (on && focus) tabs[i].focus();
      });
      if (k !== "ex") setNote(false);
      place();
    };
    tabs.forEach((b, i) => {
      b.addEventListener("click", () => select(TABS[i].key));
      b.addEventListener("keydown", (e) => {
        const to = e.key === "ArrowRight" ? (i + 1) % tabs.length : e.key === "ArrowLeft" ? (i + tabs.length - 1) % tabs.length
          : e.key === "Home" ? 0 : e.key === "End" ? tabs.length - 1 : -1;
        if (to < 0) return;
        e.preventDefault();
        select(TABS[to].key, true);
      });
    });
    root.replaceChildren(
      h("h2", { id: "side-title" }, MUSCLE_BY_ID[id].label),
      tablist,
      panels.ex, panels.an);
    select(active);
    new ResizeObserver(place).observe(tablist);  // fires when the panel becomes visible
  }

  return {
    show,
    /** Closes the dataset popover; true when it was open. */
    closePopover(): boolean { const was = Boolean(noteTip && !noteTip.hidden); setNote(false); return was; },
  };
}
