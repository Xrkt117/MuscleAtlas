import { describe, expect, it } from "vitest";
import { sectionHsl } from "./section-colors";

describe("sectionHsl", () => {
  it("gives all 24 forearm sections distinct valid colours", () => {
    const colours = Array.from({ length: 24 }, (_, index) => sectionHsl(index));
    const keys = colours.map(({ hue, saturation, lightness }) => `${hue}:${saturation}:${lightness}`);

    expect(new Set(keys).size).toBe(colours.length);
    for (const colour of colours) {
      expect(colour.hue).toBeGreaterThanOrEqual(0);
      expect(colour.hue).toBeLessThan(1);
      expect(colour.saturation).toBeGreaterThan(0);
      expect(colour.saturation).toBeLessThanOrEqual(1);
      expect(colour.lightness).toBeGreaterThan(0);
      expect(colour.lightness).toBeLessThan(1);
    }
  });

  it("rejects invalid section indices", () => {
    expect(() => sectionHsl(-1)).toThrow("non-negative integer");
    expect(() => sectionHsl(0.5)).toThrow("non-negative integer");
  });
});
