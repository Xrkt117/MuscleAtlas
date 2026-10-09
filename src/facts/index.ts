import { MUSCLE_BY_ID } from "../muscle-map";
import evidenceJson from "./evidence.json";
import exercisesJson from "./exercises.json";
import musclesJson from "./muscles.json";
import sourcesJson from "./sources.json";
import type { ActionClaim, Cite, EvidenceClaim, EvidenceFile, ExerciseLink, ExercisesFile, MusclesFile, Source, SourcesFile } from "./types";

const sources = sourcesJson as SourcesFile;
const muscles = musclesJson as MusclesFile;
const exercises = exercisesJson as ExercisesFile;
const evidence = evidenceJson as EvidenceFile;

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

/** "<authors> <year>, <title>: <locator>" */
export function formatCitation(cite: Cite): string {
  const s = getSource(cite.sourceId);
  return `${s.authors} ${s.year}, ${s.title}: ${cite.locator}`;
}
