import { describe, expect, it } from "vitest";
import { datasetGroups } from "./dataset-groups";

describe("datasetGroups", () => {
  it("capitalises, trims and dedupes case-insensitively, keeping order", () => {
    expect(datasetGroups(["chest", " Chest ", "lower back", "", "triceps"])).toEqual(["Chest", "Lower back", "Triceps"]);
  });
  it("returns an empty list for no input", () => expect(datasetGroups([])).toEqual([]));
});
