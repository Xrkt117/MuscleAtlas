import { buildGuideModel, buildPanelModel, type PanelCite, type PanelEvidence, type PanelExercise, type PanelGuideClaim } from "./facts/panel-model";
import { getSources } from "./facts";

type Attrs = Record<string, string>;
/** Tiny DOM builder: createElement + textContent only, never innerHTML. */
const h = (tag: string, attrs: Attrs | null, ...kids: (Node | string)[]): HTMLElement => {
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
const original = (c: PanelCite, quote: string) => h("details", null,
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

function exerciseItem(exercise: PanelExercise): HTMLElement {
  const secondary = exercise.datasetSecondary.length ? `; secondary: ${exercise.datasetSecondary.join(", ")}` : "";
  return h("div", { class: "exercise-item" },
    h("p", { class: "exercise-name" }, exercise.name),
    h("p", { class: "badges" },
      h("span", { class: "badge" }, exercise.mechanic === "isolation" ? "Isolation" : "Compound"),
      h("span", { class: "badge muted-badge" }, `Region ${exercise.role}`)),
    muted(`Dataset groups — primary: ${exercise.datasetPrimary.join(", ")}${secondary}`, "fine"),
    original(exercise, exercise.quote));
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

/** Render the cited panel for a muscle id, or the intro card for null. Never moves focus. */
export function renderPanel(root: HTMLElement, id: string | null): void {
  root.classList.toggle("empty", id === null);
  if (id === null) {
    root.replaceChildren(h("p", { id: "info-title", class: "intro" }, "Select a muscle to see its function and optimization exercises"));
    return;
  }
  const m = buildPanelModel(id);
  const actions = h("section", null, h("h3", null, "What it does"),
    ...m.actions.map((a) => h("div", { class: "claim" },
      h("p", null, a.text),
      muted(a.short),
      original(a, a.quote))));
  const exercises = h("section", null, h("h3", null, "Exercises"),
    muted("Source-linked examples, not a ranking. Dataset labels describe broad regions, not individual muscle heads.", "section-note"),
    ...(m.exercises.length ? m.exercises.map(exerciseItem) : [muted("No exercise mapping in the current source is specific enough for this muscle.", "empty-note")]));
  const isolation = h("section", null, h("h3", null, "Isolation"),
    muted("Single-joint options classified as isolation exercises by the exercise dataset. Other muscles can still assist.", "section-note"),
    ...(m.isolation.length
      ? [h("ul", { class: "compact-list" }, ...m.isolation.map((exercise) => h("li", null, exercise.name)))]
      : [muted("No source-verified isolation option is available for this muscle.", "empty-note")]));
  const loading = h("section", null, h("h3", null, "Loading"),
    muted("General hypertrophy guidance — not specific to this muscle or a substitute for pain-free technique.", "section-note"),
    ...m.loading.map((claim) => citedClaim(claim)));
  const evidence = h("section", null, h("h3", null, "Training evidence"),
    ...(m.specific.length ? m.specific.map(evidenceItem) : [muted("No muscle-specific studies in our sources.", "empty-note")]),
    ...(m.general.length ? [h("h4", null, "General findings, not specific to this muscle"), ...m.general.map(evidenceItem)] : []));
  root.replaceChildren(h("h2", { id: "info-title" }, m.title), actions, exercises, isolation, loading, evidence);
  root.scrollTop = 0;
}
