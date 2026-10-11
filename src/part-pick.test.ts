import { describe, expect, it } from "vitest";
import { MUSCLES } from "./muscle-map";
import { decodePartId, encodeRed, MAX_PART_IDS, PART_COUNT, partId } from "./part-pick";

describe("part-pick", () => {
  it("round-trips every part of every muscle through the 8-bit colour", () => {
    for (const m of MUSCLES) {
      m.nodes.forEach((_, i) => {
        const byte = Math.round(encodeRed(partId(m.id, i)) * 255);
        expect(decodePartId(byte), `${m.id} #${i}`).toEqual({ muscleId: m.id, partIndex: i });
      });
    }
  });

  it("has no id collisions and fits one channel", () => {
    const ids = MUSCLES.flatMap((m) => m.nodes.map((_, i) => partId(m.id, i)));
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.length).toBe(PART_COUNT);
    expect(Math.max(...ids)).toBeLessThanOrEqual(MAX_PART_IDS);
    expect(Math.min(...ids)).toBe(1);
  });

  it("decodes background and out-of-range ids to null", () => {
    expect(decodePartId(0)).toBeNull();
    expect(decodePartId(PART_COUNT + 1)).toBeNull();
    expect(decodePartId(255)).toBeNull();
    expect(decodePartId(-1)).toBeNull();
    expect(decodePartId(1.5)).toBeNull();
  });

  it("throws on an unknown part", () => {
    expect(() => partId("nope", 0)).toThrow("Unknown part");
    expect(() => partId(MUSCLES[0].id, 99)).toThrow("Unknown part");
  });
});
