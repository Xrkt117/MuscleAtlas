import { describe, expect, it } from "vitest";
import { MUSCLES } from "../muscle-map";
import { formatCitation, getFacts, getSource } from "./index";

describe("facts api", () => {
  it("getFacts throws on an unknown id", () => {
    expect(() => getFacts("nope")).toThrow("Unknown muscle id: nope");
  });

  it("a known id returns at least one action", () => {
    expect(getFacts("deltoid").actions.length).toBeGreaterThan(0);
  });

  it("'all' evidence appears for every muscle", () => {
    for (const m of MUSCLES) expect(getFacts(m.id).evidence.length, m.id).toBeGreaterThan(0);
  });

  it("serratus_anterior has an empty exercises array", () => {
    expect(getFacts("serratus_anterior").exercises).toEqual([]);
  });

  it("getSource throws on an unknown id", () => {
    expect(() => getSource("nope")).toThrow("Unknown source id: nope");
  });

  it("formatCitation includes the source title and the locator", () => {
    const cite = getFacts("deltoid").actions[0].cite;
    const out = formatCitation(cite);
    expect(out).toContain("Anatomy of the Human Body");
    expect(out).toContain(cite.locator);
    expect(out).toContain("Gray");
    expect(out).toContain("1918");
  });
});
