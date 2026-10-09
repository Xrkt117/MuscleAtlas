import { describe, expect, it } from "vitest";
import { MUSCLES } from "../muscle-map";
import { buildPanelModel } from "./panel-model";
import type { PanelCite } from "./panel-model";

const allCites = (m: ReturnType<typeof buildPanelModel>): PanelCite[] => [...m.actions, ...m.specific, ...m.general];

describe("buildPanelModel", () => {
  it("deltoid has 3 fully populated actions", () => {
    const m = buildPanelModel("deltoid");
    expect(m.title).toBeTruthy();
    expect(m.actions).toHaveLength(3);
    for (const a of m.actions) for (const k of ["quote", "short", "full", "licence"] as const) expect(a[k].trim(), k).not.toBe("");
  });

  it("Gray short citation has a page", () => {
    expect(buildPanelModel("deltoid").actions[0].short).toMatch(/^Gray 1918, p\. \d+/);
  });

  it("triceps: triceps claim specific, 12-20 claim absent", () => {
    const m = buildPanelModel("triceps_brachii");
    expect(m.specific.some((e) => e.text.includes("triceps brachii"))).toBe(true);
    expect([...m.specific, ...m.general].some((e) => e.text.includes("12-20"))).toBe(false);
  });

  it("soleus has the single-study claim", () => {
    const e = buildPanelModel("soleus").specific.find((x) => x.text.includes("soleus"));
    expect(e?.badges).toEqual(["Single study"]);
  });

  it("every muscle's general has the Schoenfeld claims, abstract only", () => {
    for (const { id } of MUSCLES) {
      const g = buildPanelModel(id).general.filter((e) => e.short.startsWith("Schoenfeld"));
      expect(g, id).toHaveLength(2);
      for (const e of g) expect(e.badges).toEqual(["Abstract only"]);
    }
  });

  it("no specific claims gives []", () => {
    expect(buildPanelModel("latissimus_dorsi").specific).toEqual([]);
  });

  it("throws on unknown id", () => {
    expect(() => buildPanelModel("nope")).toThrow("Unknown muscle id: nope");
  });

  it("no exercises key; every cite has licence and short", () => {
    for (const { id } of MUSCLES) {
      const m = buildPanelModel(id);
      expect(JSON.stringify(m)).not.toContain('"exercises"');
      for (const c of allCites(m)) {
        expect(c.licence.trim()).not.toBe("");
        expect(c.short.trim()).not.toBe("");
      }
    }
  });
});
