import { MUSCLE_BY_ID } from "../muscle-map";
import evidenceJson from "./evidence.json";
import exercisesJson from "./exercises.json";
import guideJson from "./guide.json";
import musclesJson from "./muscles.json";
import sourcesJson from "./sources.json";
import type { ActionClaim, Cite, EvidenceClaim, EvidenceFile, ExerciseLink, ExercisesFile, GuideClaim, GuideFile, MusclesFile, Source, SourcesFile } from "./types";

const sources = sourcesJson as SourcesFile;
const muscles = musclesJson as MusclesFile;
const exercises = exercisesJson as ExercisesFile;
const evidence = evidenceJson as EvidenceFile;
const guide = guideJson as GuideFile;

/** Cited facts for a muscle id. Throws on unknown id. */
export function getFacts(id: string): { actions: ActionClaim[]; exercises: ExerciseLink[]; evidence: EvidenceClaim[] } {
  if (!MUSCLE_BY_ID[id]) throw new Error(`Unknown muscle id: ${id}`);
  return {
    actions: muscles[id]?.actions ?? [],
    exercises: exercises[id] ?? [],
    evidence: evidence.filter((e) => e.appliesTo === "all" || e.appliesTo.includes(id)),
  };
}

/** Throws on unknown source id. */
export function getSource(id: string): Source {
  const s = sources.find((x) => x.id === id);
  if (!s) throw new Error(`Unknown source id: ${id}`);
  return s;
}

/** Complete source registry, in display order. */
export function getSources(): SourcesFile {
  return sources;
}

/** General muscle-building guide, in display order. */
export function getGuide(): GuideFile {
  return guide;
}

/** Throws on an unknown guide claim id. */
export function getGuideClaim(id: string): GuideClaim {
  const claim = guide.flatMap((section) => section.claims).find((item) => item.id === id);
  if (!claim) throw new Error(`Unknown guide claim id: ${id}`);
  return claim;
}

/** "<authors> <year>, <title>: <locator>" */
export function formatCitation(cite: Cite): string {
  const s = getSource(cite.sourceId);
  return `${s.authors} ${s.year}, ${s.title}: ${cite.locator}`;
}
