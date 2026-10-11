import datasetMapJson from "./facts/dataset-muscle-map.json";
import { getFacts } from "./facts";
import { MUSCLE_BY_ID, MUSCLES } from "./muscle-map";
import type { ExerciseLink } from "./facts/types";

export interface MixerMatch {
  datasetId: string;
  name: string;
  mechanic: ExerciseLink["mechanic"];
  datasetPrimary: string[];
  datasetSecondary: string[];
  primaryFor: string[];
  secondaryFor: string[];
  sourceId: "free-exercise-db";
}

const mapping = datasetMapJson.mapping as Record<string, { muscleIds: string[] }>;
const uniqueExercises = new Map<string, ExerciseLink>();
for (const { id } of MUSCLES) {
  for (const exercise of getFacts(id).exercises) uniqueExercises.set(exercise.datasetId, exercise);
}

const coveredMuscles = (groups: string[]): Set<string> => {
  const covered = new Set<string>();
  for (const group of groups) for (const id of mapping[group]?.muscleIds ?? []) covered.add(id);
  return covered;
};

/** Exercises whose dataset primary/secondary regions cover every selected MuscleAtlas group. */
export function mixerMatches(ids: readonly string[]): MixerMatch[] {
  const selected = [...new Set(ids)].filter((id) => MUSCLE_BY_ID[id]);
  if (!selected.length) return [];

  const matches: MixerMatch[] = [];
  for (const exercise of uniqueExercises.values()) {
    const primary = coveredMuscles(exercise.datasetPrimary);
    const secondary = coveredMuscles(exercise.datasetSecondary);
    if (!selected.every((id) => primary.has(id) || secondary.has(id))) continue;
    matches.push({
      datasetId: exercise.datasetId,
      name: exercise.name,
      mechanic: exercise.mechanic,
      datasetPrimary: exercise.datasetPrimary,
      datasetSecondary: exercise.datasetSecondary,
      primaryFor: selected.filter((id) => primary.has(id)),
      secondaryFor: selected.filter((id) => !primary.has(id) && secondary.has(id)),
      sourceId: "free-exercise-db",
    });
  }

  return matches.sort((a, b) =>
    b.primaryFor.length - a.primaryFor.length
    || (a.datasetPrimary.length + a.datasetSecondary.length) - (b.datasetPrimary.length + b.datasetSecondary.length)
    || a.name.localeCompare(b.name));
}
