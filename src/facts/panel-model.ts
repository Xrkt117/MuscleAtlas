import { MUSCLE_BY_ID } from "../muscle-map";
import { formatCitation, getFacts, getGuide, getGuideClaim, getSource } from "./index";
import type { Cite, GuideClaim } from "./types";

export interface PanelCite { short: string; full: string; licence: string; url: string }
export interface PanelAction extends PanelCite { text: string; quote: string }
export interface PanelEvidence extends PanelCite { text: string; quote: string; badges: ("Abstract only" | "Single study" | "Group finding")[] }
export interface PanelExercise extends PanelCite {
  name: string;
  quote: string;
  mechanic: "compound" | "isolation";
  modality: "calisthenics" | "external-load";
  role: "primary" | "secondary";
  datasetPrimary: string[];
  datasetSecondary: string[];
}
export interface PanelGuideClaim extends PanelCite { text: string; quote: string; badges: ("Model estimate" | "Clinic guide")[] }
export interface PanelGuideSection { id: string; title: string; claims: PanelGuideClaim[] }
export interface PanelModel {
  id: string;
  title: string;
  actions: PanelAction[];
  exercises: PanelExercise[];
  calisthenics: PanelExercise[];
  loadedExercises: PanelExercise[];
  isolation: PanelExercise[];
  programming: PanelGuideClaim[];
  specific: PanelEvidence[];
  general: PanelEvidence[];
}

const calisthenicsExerciseIds = new Set([
  "Bodyweight_Squat",
  "Butt_Lift_Bridge",
  "Crunches",
  "Dips_-_Triceps_Version",
  "Incline_Push-Up",
  "Plank",
  "Pullups",
  "Pushups",
  "Reverse_Crunch",
  "Single_Leg_Glute_Bridge",
]);

function panelCite(cite: Cite): PanelCite {
  const s = getSource(cite.sourceId);
  const page = cite.locator.match(/\(p\. ([^)]+)\)|\bpp?\. \d+(?:[-–]\d+)?/);
  const where = page ? `p${page[1] === undefined ? page[0].slice(1) : `. ${page[1]}`}` : /abstract/i.test(cite.locator) ? "abstract" : "";
  return { short: where ? `${s.short}, ${where}` : s.short, full: formatCitation(cite), licence: s.licence, url: s.url };
}

function panelGuideClaim(claim: GuideClaim): PanelGuideClaim {
  return {
    text: claim.text,
    quote: claim.cite.quote,
    badges: claim.badge ? [claim.badge] : [],
    ...panelCite(claim.cite),
  };
}

export function buildGuideModel(): PanelGuideSection[] {
  return getGuide().map((section) => ({
    id: section.id,
    title: section.title,
    claims: section.claims.map(panelGuideClaim),
  }));
}

export function buildPanelModel(id: string): PanelModel {
  const f = getFacts(id);
  const panelExercise = (exercise: (typeof f.exercises)[number]): PanelExercise => ({
    name: exercise.name,
    quote: exercise.cite.quote,
    mechanic: exercise.mechanic,
    modality: calisthenicsExerciseIds.has(exercise.datasetId) ? "calisthenics" : "external-load",
    role: exercise.role,
    datasetPrimary: exercise.datasetPrimary,
    datasetSecondary: exercise.datasetSecondary,
    ...panelCite(exercise.cite),
  });
  const panelExercises = f.exercises.map(panelExercise);
  const evidence = (general: boolean): PanelEvidence[] =>
    f.evidence
      .filter((e) => !!e.general === general)
      .map((e) => ({
        text: e.text,
        quote: e.cite.quote,
        ...panelCite(e.cite),
        badges: [
          ...(e.caveat === "abstract-only" ? ["Abstract only" as const] : e.caveat === "single-study" ? ["Single study" as const] : []),
          ...(e.scope === "group" ? ["Group finding" as const] : []),
        ],
      }));
  return {
    id,
    title: MUSCLE_BY_ID[id].label,
    actions: f.actions.map((a) => ({ text: a.text, quote: a.cite.quote, ...panelCite(a.cite) })),
    exercises: panelExercises,
    calisthenics: panelExercises.filter((exercise) => exercise.modality === "calisthenics"),
    loadedExercises: panelExercises.filter((exercise) => exercise.modality === "external-load"),
    isolation: panelExercises.filter((exercise) => exercise.mechanic === "isolation"),
    programming: [
      "moderate-load-template",
      "wide-loading-range",
      "trained-volume-template",
      "proximity-to-failure",
      "programming-fundamentals",
    ].map((claimId) => panelGuideClaim(getGuideClaim(claimId))),
    specific: evidence(false),
    general: evidence(true),
  };
}
