import { describe, expect, it } from "vitest";
import { MUSCLES } from "../muscle-map";
import { buildGuideModel, buildPanelModel } from "./panel-model";
import type { PanelCite } from "./panel-model";

const allCites = (m: ReturnType<typeof buildPanelModel>): PanelCite[] => [...m.actions, ...m.exercises, ...m.programming, ...m.specific, ...m.general];

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

  it("every evidence item has a non-empty quote, and every cite has a url", () => {
    for (const { id } of MUSCLES) {
      const m = buildPanelModel(id);
      for (const e of [...m.specific, ...m.general]) expect(e.quote.trim(), e.text).not.toBe("");
      for (const c of allCites(m)) expect(c.url, c.short).toMatch(/^https?:\/\//);
    }
  });

  it("the hamstrings finding carries the Group finding badge on all three hamstrings", () => {
    for (const id of ["biceps_femoris", "semitendinosus", "semimembranosus"]) {
      const e = buildPanelModel(id).specific.find((x) => x.short.startsWith("Maeo"));
      expect(e?.badges, id).toEqual(["Single study", "Group finding"]);
    }
    expect(buildPanelModel("soleus").specific.flatMap((e) => e.badges)).not.toContain("Group finding");
  });

  it("every available exercise and programming claim has a complete citation", () => {
    for (const { id } of MUSCLES) {
      const m = buildPanelModel(id);
      expect(m.programming).toHaveLength(5);
      expect(m.isolation.every((exercise) => exercise.mechanic === "isolation")).toBe(true);
      expect([...m.calisthenics, ...m.loadedExercises]).toHaveLength(m.exercises.length);
      for (const c of allCites(m)) {
        expect(c.licence.trim()).not.toBe("");
        expect(c.short.trim()).not.toBe("");
      }
    }
  });

  it("forearms expose their broad exercises as isolation options", () => {
    const m = buildPanelModel("forearm_muscles");
    expect(m.exercises.map((exercise) => exercise.name)).toEqual([
      "Palms-Up Barbell Wrist Curl Over A Bench",
      "Palms-Down Dumbbell Wrist Curl Over A Bench",
    ]);
    expect(m.isolation).toHaveLength(2);
  });

  it("known exercise gaps stay explicit instead of inventing mappings", () => {
    for (const id of ["serratus_anterior", "brachialis", "teres_major"]) {
      const m = buildPanelModel(id);
      expect(m.exercises, id).toEqual([]);
      expect(m.isolation, id).toEqual([]);
    }
  });

  it("the general guide exposes all categories and the Cambridge model badge", () => {
    const guide = buildGuideModel();
    expect(guide).toHaveLength(6);
    const model = guide.flatMap((section) => section.claims).find((claim) => claim.short.startsWith("Cambridge"));
    expect(model?.badges).toEqual(["Model estimate"]);
  });

  it("separates bodyweight exercises from externally loaded options", () => {
    const chest = buildPanelModel("pectoralis_major");
    expect(chest.calisthenics.map((exercise) => exercise.name)).toEqual(["Pushups", "Incline Push-Up"]);
    expect(chest.loadedExercises.map((exercise) => exercise.name)).toEqual(["Dumbbell Bench Press"]);
  });

  it("uses strength-category band adduction instead of a plyometric lateral bound", () => {
    const adductors = buildPanelModel("hip_adductors");
    expect(adductors.exercises.map((exercise) => exercise.name)).toEqual(["Thigh Adductor", "Band Hip Adductions"]);
  });
});
