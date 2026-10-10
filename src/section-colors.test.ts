import { describe, expect, it } from "vitest";
import { MUSCLES } from "./muscle-map";
import { ABDOMINAL_SECTION_STYLES, SECTION_COLORS, sectionColor } from "./section-colors";

const channels = (color: number) => [(color >> 16) & 0xff, (color >> 8) & 0xff, color & 0xff];
const distanceSquared = (a: number, b: number) => {
  const ac = channels(a), bc = channels(b);
  return ac.reduce((sum, channel, i) => sum + (channel - bc[i]) ** 2, 0);
};

describe("sectionColor", () => {
  it("covers the largest mapped group with unique valid colours", () => {
    const needed = Math.max(...MUSCLES.map((muscle) => muscle.nodes.length));
    const colours = Array.from({ length: needed }, (_, index) => sectionColor(index));

    expect(SECTION_COLORS.length).toBeGreaterThanOrEqual(needed);
    expect(new Set(colours).size).toBe(colours.length);
    for (const colour of colours) {
      expect(colour).toBeGreaterThanOrEqual(0x000000);
      expect(colour).toBeLessThanOrEqual(0xffffff);
    }
  });

  it("keeps the five abdominal layer colours strongly separated", () => {
    const abdominalColours = ABDOMINAL_SECTION_STYLES.map((style) => style.color);
    for (let i = 0; i < abdominalColours.length; i++) {
      for (let j = i + 1; j < abdominalColours.length; j++) {
        expect(distanceSquared(abdominalColours[i], abdominalColours[j])).toBeGreaterThan(5_000);
      }
    }
  });

  it("uses an anatomical cutaway for the overlapping abdominal sheets", () => {
    const abdominal = MUSCLES.find((muscle) => muscle.id === "rectus_abdominis");
    expect(abdominal).toBeDefined();
    expect(ABDOMINAL_SECTION_STYLES).toHaveLength(abdominal!.nodes.length);
    expect(ABDOMINAL_SECTION_STYLES[0].opacity).toBe(1);
    expect(ABDOMINAL_SECTION_STYLES[4].opacity).toBe(1);
    expect(ABDOMINAL_SECTION_STYLES[1].opacity).toBeLessThan(ABDOMINAL_SECTION_STYLES[2].opacity);
    expect(ABDOMINAL_SECTION_STYLES[2].opacity).toBeLessThan(ABDOMINAL_SECTION_STYLES[3].opacity);
    expect(ABDOMINAL_SECTION_STYLES[1].renderOrder).toBeGreaterThan(ABDOMINAL_SECTION_STYLES[2].renderOrder);
    expect(ABDOMINAL_SECTION_STYLES[2].renderOrder).toBeGreaterThan(ABDOMINAL_SECTION_STYLES[3].renderOrder);
    expect(ABDOMINAL_SECTION_STYLES[0].renderOrder).toBeGreaterThan(ABDOMINAL_SECTION_STYLES[1].renderOrder);
    expect(ABDOMINAL_SECTION_STYLES[4].renderOrder).toBeGreaterThan(ABDOMINAL_SECTION_STYLES[1].renderOrder);
  });

  it("rejects invalid or unconfigured section indices", () => {
    expect(() => sectionColor(-1)).toThrow("non-negative integer");
    expect(() => sectionColor(0.5)).toThrow("non-negative integer");
    expect(() => sectionColor(SECTION_COLORS.length)).toThrow("No section colour");
  });
});
