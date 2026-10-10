import { describe, expect, it } from "vitest";
import { progressFraction } from "./progress";

describe("progressFraction", () => {
  it("is null while the total is unknown", () => {
    expect(progressFraction(10, 0)).toBeNull();
  });
  it("is loaded/total", () => {
    expect(progressFraction(50, 200)).toBe(0.25);
  });
  it("clamps decompressed bytes over compressed total to 1", () => {
    expect(progressFraction(106, 100)).toBe(1);
  });
});
