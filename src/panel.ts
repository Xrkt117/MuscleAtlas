import { buildGuideModel, buildPanelModel, type PanelCite, type PanelEvidence, type PanelGuideClaim } from "./facts/panel-model";
import { getSources } from "./facts";

type Attrs = Record<string, string>;
/** Tiny DOM builder: createElement + textContent only, never innerHTML. */
export const h = (tag: string, attrs: Attrs | null, ...kids: (Node | string)[]): HTMLElement => {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs ?? {})) el.setAttribute(k, v);
  el.append(...kids);
  return el;
};
const muted = (text: string, cls = "cite") => h("p", { class: cls }, text);
const fullCite = (c: PanelCite) => [
  muted(c.full, "fine"),
  h("p", { class: "fine" }, h("a", { href: c.url, rel: "noopener noreferrer", target: "_blank" }, c.url)),
  muted(`Licence: ${c.licence}`, "fine"),
];
export const original = (c: PanelCite, quote: string) => h("details", null,
  h("summary", null, `${c.short.split(",")[0]}, original wording`),
  h("blockquote", null, quote),
  ...fullCite(c));

function citedClaim(e: PanelEvidence | PanelGuideClaim, cls = "claim"): HTMLElement {
  return h("div", { class: cls },
    h("p", null, e.text),
    muted(e.short),
    ...(e.badges.length ? [h("p", { class: "badges" }, ...e.badges.map((b) => h("span", { class: "badge" }, b)))] : []),
    original(e, e.quote));
}

function evidenceItem(e: PanelEvidence): HTMLElement {
  return citedClaim(e);
}

/** Render the permanent, cited muscle-building overview in the left rail. */
export function renderGuide(root: HTMLElement): void {
  const sections = buildGuideModel().map((section) => h("section", { "data-guide-section": section.id },
    h("h3", null, section.title),
    ...section.claims.map((claim) => citedClaim(claim, "guide-claim"))));
  root.replaceChildren(
    muted("General education, not individualized medical or nutrition advice.", "guide-note"),
    ...sections);
}

/** Render model credits and every registered information source. */
export function renderSources(root: HTMLElement): void {
  const modelSources = [
    {
      title: "Z-Anatomy — The libre 3D atlas of anatomy",
      url: "https://www.z-anatomy.com/",
      licence: "Creative Commons Attribution-ShareAlike 4.0 (CC BY-SA 4.0)",
    },
    {
      title: "BodyParts3D — The Database Center for Life Science",
      url: "https://lifesciencedb.jp/bp3d/",
      licence: "Creative Commons Attribution-ShareAlike 2.1 Japan (CC BY-SA 2.1 JP)",
    },
  ];
  const sourceLink = (title: string, url: string, meta: string, notes?: string) => h("div", { class: "source-item" },
    h("a", { href: url, rel: "noopener noreferrer", target: "_blank" }, title),
    muted(meta, "fine"),
    ...(notes ? [h("details", { class: "source-notes" },
      h("summary", null, "Licence and source notes"),
      muted(notes, "fine"))] : []));
  root.replaceChildren(
    h("section", null,
      h("h3", null, "3D model"),
      ...modelSources.map((source) => sourceLink(source.title, source.url, source.licence))),
    h("section", null,
      h("h3", null, "Anatomy, exercise and training information"),
      ...getSources().map((source) => sourceLink(
        source.title,
        source.url,
        `${source.authors} (${source.year})`,
        source.licence))),
  );
}

/** The cited anatomy content of a muscle (exercises live in the side panel's first tab). */
export function anatomyContent(id: string): HTMLElement[] {
  const m = buildPanelModel(id);
  const actions = h("section", null, h("h3", null, "What it does"),
    ...m.actions.map((a) => h("div", { class: "claim" },
      h("p", null, a.text),
      muted(a.short),
      original(a, a.quote))));
  const programming = h("section", null, h("h3", null, "Hypertrophy programming"),
    muted("General, evidence-linked programming guidance — not specific to this muscle or a substitute for pain-free technique and individualized recovery.", "section-note"),
    ...m.programming.map((claim) => citedClaim(claim)));
  const evidence = h("section", null, h("h3", null, "Training evidence"),
    ...(m.specific.length ? m.specific.map(evidenceItem) : [muted("No muscle-specific studies in our sources.", "empty-note")]),
    ...(m.general.length ? [h("h4", null, "General findings, not specific to this muscle"), ...m.general.map(evidenceItem)] : []));
  return [actions, programming, evidence];
}
