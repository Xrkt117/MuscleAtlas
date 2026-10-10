import { describe, expect, it } from "vitest";
import { facingVisibility, smoothstep } from "./visibility";

describe("facingVisibility", () => {
  it("is 0 below 0.1 and 1 above 0.35", () => {
    expect(facingVisibility(-1)).toBe(0);
    expect(facingVisibility(0.1)).toBe(0);
    expect(facingVisibility(0.35)).toBe(1);
    expect(facingVisibility(1)).toBe(1);
  });
  it("is strictly between 0 and 1 at the midpoint", () => {
    const v = facingVisibility(0.225);
    expect(v).toBeGreaterThan(0);
    expect(v).toBeLessThan(1);
  });
  it("is monotonic", () => {
    let prev = -1;
    for (let d = -1; d <= 1; d += 0.01) { const v = facingVisibility(d); expect(v).toBeGreaterThanOrEqual(prev); prev = v; }
  });
});
describe("smoothstep", () => {
  it("clamps and is 0.5 at the middle", () => {
    expect(smoothstep(0, 1, -5)).toBe(0);
    expect(smoothstep(0, 1, 5)).toBe(1);
    expect(smoothstep(0, 1, 0.5)).toBeCloseTo(0.5);
  });
});
