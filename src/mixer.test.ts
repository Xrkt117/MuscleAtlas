import { describe, expect, it } from "vitest";
import { mixerMatches } from "./mixer";

describe("mixerMatches", () => {
  it("finds exercises whose cited regions cover chest, shoulders and triceps", () => {
    const names = mixerMatches(["pectoralis_major", "deltoid", "triceps_brachii"]).map((exercise) => exercise.name);
    expect(names).toEqual(expect.arrayContaining(["Pushups", "Dumbbell Bench Press", "Incline Push-Up", "Dips - Triceps Version"]));
  });

  it("does not invent a match for an unmapped fine-grained muscle", () => {
    expect(mixerMatches(["teres_major", "latissimus_dorsi"])).toEqual([]);
  });

  it("deduplicates selections and rejects unknown ids", () => {
    expect(mixerMatches(["pectoralis_major", "pectoralis_major", "unknown"]).map((exercise) => exercise.datasetId))
      .toEqual(mixerMatches(["pectoralis_major"]).map((exercise) => exercise.datasetId));
  });
});
