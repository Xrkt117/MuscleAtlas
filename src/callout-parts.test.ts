import { describe, expect, it } from "vitest";
import { calloutLabel, pickCalloutParts } from "./callout-parts";

describe("pickCalloutParts", () => {
  it("returns all indices when sizes.length <= max", () => {
    expect(pickCalloutParts([3, 1, 2])).toEqual([0, 1, 2]);
    expect(pickCalloutParts([1, 2, 3], 3)).toEqual([0, 1, 2]);
    expect(pickCalloutParts([])).toEqual([]);
  });

  it("keeps the max largest, in original index order", () => {
    expect(pickCalloutParts([1, 9, 2, 8, 3, 7], 3)).toEqual([1, 3, 5]);
  });

  it("breaks ties by lower index", () => {
    expect(pickCalloutParts([5, 5, 5, 5], 2)).toEqual([0, 1]);
    expect(pickCalloutParts([1, 4, 4, 4], 2)).toEqual([1, 2]);
  });

  it("defaults to 6", () => {
    expect(pickCalloutParts(Array.from({ length: 24 }, (_, i) => i)).length).toBe(6);
  });
});

describe("calloutLabel", () => {
  it("drops a tail that repeats the muscle name", () => {
    expect(calloutLabel("Clavicular head of pectoralis major", "Pectoralis major")).toBe("Clavicular head");
    expect(calloutLabel("Abdominal part of pectoralis major", "Pectoralis major")).toBe("Abdominal part");
    expect(calloutLabel("Long head of biceps brachii", "Biceps brachii")).toBe("Long head");
  });
  it("keeps other names whole, cleaned", () => {
    expect(calloutLabel("Humeral head of flexor carpi ulnaris", "Forearms")).toBe("Humeral head of flexor carpi ulnaris");
    expect(calloutLabel("(Adductor minimus).l", "Hip adductors (inner thigh)")).toBe("Adductor minimus");
    expect(calloutLabel("Rhomboid_major muscle", "Rhomboids")).toBe("Rhomboid major");
    expect(calloutLabel("rectus abdominis", "Abdominals")).toBe("Rectus abdominis");
  });
});
