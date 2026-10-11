import { MUSCLE_BY_ID, MUSCLES } from "./muscle-map";
import { getEvidence, getFacts, getGuide, getSources } from "./facts";
import { mixerMatches } from "./mixer";

export interface ChatKnowledge {
  selectedMuscle: string | null;
  mixer: { muscleIds: string[]; muscleLabels: string[]; matchingExercises: ReturnType<typeof mixerMatches> };
  sources: { id: string; title: string; authors: string; year: number; url: string }[];
  guide: ReturnType<typeof getGuide>;
  evidence: ReturnType<typeof getEvidence>;
  muscles: {
    id: string;
    label: string;
    actions: ReturnType<typeof getFacts>["actions"];
    exercises: ReturnType<typeof getFacts>["exercises"];
  }[];
}

const modelSources = [
  {
    id: "model-z-anatomy",
    title: "Z-Anatomy — The libre 3D atlas of anatomy",
    authors: "Z-Anatomy contributors",
    year: 2026,
    url: "https://www.z-anatomy.com/",
  },
  {
    id: "model-bodyparts3d",
    title: "BodyParts3D — The Database Center for Life Science",
    authors: "Database Center for Life Science",
    year: 2026,
    url: "https://lifesciencedb.jp/bp3d/",
  },
];

/** Public, cited project knowledge sent to the server-side tutor with each request. */
export function buildChatKnowledge(selectedId: string | null, mixedIds: readonly string[] = []): ChatKnowledge {
  const selectedMuscle = selectedId && MUSCLE_BY_ID[selectedId] ? selectedId : null;
  const muscleIds = [...new Set(mixedIds)].filter((id) => MUSCLE_BY_ID[id]);
  return {
    selectedMuscle,
    mixer: {
      muscleIds,
      muscleLabels: muscleIds.map((id) => MUSCLE_BY_ID[id].label),
      matchingExercises: mixerMatches(muscleIds),
    },
    sources: [
      ...modelSources,
      ...getSources().map(({ id, title, authors, year, url }) => ({ id, title, authors, year, url })),
    ],
    guide: getGuide(),
    evidence: getEvidence(),
    muscles: MUSCLES.map(({ id, label }) => {
      const facts = getFacts(id);
      return { id, label, actions: facts.actions, exercises: facts.exercises };
    }),
  };
}
