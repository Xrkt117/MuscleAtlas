import { buildPanelModel, type PanelCite, type PanelEvidence } from "./facts/panel-model";

type Attrs = Record<string, string>;
/** Tiny DOM builder: createElement + textContent only, never innerHTML. */
const h = (tag: string, attrs: Attrs | null, ...kids: (Node | string)[]): HTMLElement => {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs ?? {})) el.setAttribute(k, v);
  el.append(...kids);
  return el;
};
const muted = (text: string, cls = "cite") => h("p", { class: cls }, text);
const fullCite = (c: PanelCite) => [muted(c.full, "fine"), muted(`Licence: ${c.licence}`, "fine")];

function evidenceItem(e: PanelEvidence): HTMLElement {
  return h("div", { class: "claim" },
    h("p", null, e.text),
    muted(e.short),
    ...(e.badges.length ? [h("p", { class: "badges" }, ...e.badges.map((b) => h("span", { class: "badge" }, b)))] : []),
    h("details", null, h("summary", null, "Citation and licence"), ...fullCite(e)));
}

/** Render the cited panel for a muscle id, or the intro card for null. Never moves focus. */
export function renderPanel(root: HTMLElement, id: string | null): void {
  root.classList.toggle("empty", id === null);
  if (id === null) {
    root.replaceChildren(h("p", { id: "info-title", class: "intro" }, "Select a muscle to see what it does and the evidence"));
    return;
  }
  const m = buildPanelModel(id);
  const actions = h("section", null, h("h3", null, "What it does"),
    ...m.actions.map((a) => h("div", { class: "claim" },
      h("p", null, a.text),
      muted(a.short),
      h("details", null,
        h("summary", null, `${a.short.split(",")[0]}, original wording`),
        h("blockquote", null, a.quote),
        ...fullCite(a)))));
  const evidence = h("section", null, h("h3", null, "Training evidence"),
    ...(m.specific.length ? m.specific.map(evidenceItem) : [muted("No muscle-specific studies in our sources.", "empty-note")]),
    ...(m.general.length ? [h("h4", null, "General findings, not specific to this muscle"), ...m.general.map(evidenceItem)] : []));
  root.replaceChildren(h("h2", { id: "info-title" }, m.title), actions, evidence);
  root.scrollTop = 0;
}
