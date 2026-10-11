import { describe, expect, it } from "vitest";
import { MUSCLES } from "./muscle-map";
import { buildChatKnowledge } from "./chat-context";

describe("buildChatKnowledge", () => {
  it("includes every mapped muscle and every citation target", () => {
    const knowledge = buildChatKnowledge("deltoid", ["pectoralis_major", "triceps_brachii"]);
    expect(knowledge.selectedMuscle).toBe("deltoid");
    expect(knowledge.mixer.muscleLabels).toEqual(["Pectoralis major", "Triceps brachii"]);
    expect(knowledge.mixer.matchingExercises.length).toBeGreaterThan(0);
    expect(knowledge.muscles.map((muscle) => muscle.id)).toEqual(MUSCLES.map((muscle) => muscle.id));

    const sourceIds = new Set(knowledge.sources.map((source) => source.id));
    const citedIds = [
      ...knowledge.guide.flatMap((section) => section.claims.map((claim) => claim.cite.sourceId)),
      ...knowledge.evidence.map((claim) => claim.cite.sourceId),
      ...knowledge.muscles.flatMap((muscle) => [
        ...muscle.actions.map((claim) => claim.cite.sourceId),
        ...muscle.exercises.map((exercise) => exercise.cite.sourceId),
      ]),
    ];
    expect(citedIds.filter((id) => !sourceIds.has(id))).toEqual([]);
  });

  it("drops an unknown selected muscle without dropping the knowledge base", () => {
    const knowledge = buildChatKnowledge("not-a-muscle");
    expect(knowledge.selectedMuscle).toBeNull();
    expect(knowledge.muscles).toHaveLength(MUSCLES.length);
  });
});
