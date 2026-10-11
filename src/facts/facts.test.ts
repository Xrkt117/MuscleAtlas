import { describe, expect, it } from "vitest";
import { MUSCLES } from "../muscle-map";
import evidenceJson from "./evidence.json";
import exercisesJson from "./exercises.json";
import guideJson from "./guide.json";
import musclesJson from "./muscles.json";
import sourcesJson from "./sources.json";
import type { Cite, EvidenceFile, ExercisesFile, GuideFile, MusclesFile, SourcesFile } from "./types";

const sources = sourcesJson as SourcesFile;
const muscles = musclesJson as MusclesFile;
const exercises = exercisesJson as ExercisesFile;
const evidence = evidenceJson as EvidenceFile;
const guide = guideJson as GuideFile;
const ids = MUSCLES.map((m) => m.id);

// The dataset has no group specific enough to support exercise links for these muscles without guessing.
const KNOWN_EXERCISE_GAPS = ["serratus_anterior", "brachialis", "teres_major"];

const cites: Cite[] = [
  ...Object.values(muscles).flatMap((m) => m.actions.map((a) => a.cite)),
  ...Object.values(exercises).flatMap((l) => l.map((e) => e.cite)),
  ...evidence.map((e) => e.cite),
  ...guide.flatMap((section) => section.claims.map((claim) => claim.cite)),
];

describe("facts data", () => {
  it("has cites to check", () => expect(cites.length).toBeGreaterThan(0));

  it("every cite points at a known source", () => {
    const have = new Set(sources.map((s) => s.id));
    expect(cites.filter((c) => !have.has(c.sourceId))).toEqual([]);
  });

  it("every source has licence, url and an ISO readOn date", () => {
    for (const s of sources) {
      expect(s.licence.trim(), s.id).not.toBe("");
      expect(s.url.trim(), s.id).not.toBe("");
      expect(s.readOn, s.id).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(Number.isNaN(Date.parse(s.readOn)), s.id).toBe(false);
    }
  });

  it("no source licence forbids AI use (this file is fed to an AI)", () => {
    const bad = sources.filter((s) => /large language model|generative AI|may not be used in the training/i.test(s.licence));
    expect(bad.map((s) => s.id)).toEqual([]);
  });

  it("no source is unused", () => {
    const used = new Set(cites.map((c) => c.sourceId));
    expect(sources.filter((s) => !used.has(s.id)).map((s) => s.id)).toEqual([]);
  });

  it("has no duplicate ids", () => {
    expect(new Set(sources.map((s) => s.id)).size).toBe(sources.length);
    for (const [mid, list] of Object.entries(exercises)) {
      const d = list.map((e) => e.datasetId);
      expect(new Set(d).size, mid).toBe(d.length);
    }
    const sectionIds = guide.map((section) => section.id);
    const claimIds = guide.flatMap((section) => section.claims.map((claim) => claim.id));
    expect(new Set(sectionIds).size).toBe(sectionIds.length);
    expect(new Set(claimIds).size).toBe(claimIds.length);
  });

  it("every locator is non-empty and every quote has at most 25 words", () => {
    for (const c of cites) {
      expect(c.locator.trim(), c.quote).not.toBe("");
      expect(c.quote.trim().split(/\s+/).length, c.quote).toBeLessThanOrEqual(25);
    }
  });

  it("keys only seed muscle ids", () => {
    expect(Object.keys(muscles).filter((k) => !ids.includes(k))).toEqual([]);
    expect(Object.keys(exercises).filter((k) => !ids.includes(k))).toEqual([]);
  });

  it("every muscle has at least 1 action claim", () => {
    expect(ids.filter((id) => (muscles[id]?.actions.length ?? 0) < 1)).toEqual([]);
  });

  it("every muscle has at least 2 exercise links, except the known gaps which have 0", () => {
    for (const id of ids) {
      const n = exercises[id]?.length ?? 0;
      if (KNOWN_EXERCISE_GAPS.includes(id)) expect(n, id).toBe(0);
      else expect(n, id).toBeGreaterThanOrEqual(2);
    }
  });

  it("every exercise has a supported mechanic classification", () => {
    for (const [id, list] of Object.entries(exercises)) {
      for (const exercise of list) expect(["compound", "isolation"], `${id}: ${exercise.name}`).toContain(exercise.mechanic);
    }
  });

  it("the guide covers the requested training topics", () => {
    expect(guide.map((section) => section.id)).toEqual(["training-stimulus", "loading", "programming", "exercise-choice", "frequency", "nutrition-sleep"]);
    for (const section of guide) expect(section.claims.length, section.id).toBeGreaterThan(0);
  });

  it("evidence appliesTo is 'all' or only seed ids", () => {
    for (const e of evidence) {
      if (e.appliesTo !== "all") {
        expect(e.appliesTo.length).toBeGreaterThan(0);
        expect(e.appliesTo.filter((id) => !ids.includes(id))).toEqual([]);
      }
    }
  });
  it("every source has a non-empty unique short name", () => {
    const shorts = sources.map((s) => s.short);
    for (const s of sources) expect(s.short?.trim(), s.id).toBeTruthy();
    expect(new Set(shorts).size).toBe(shorts.length);
  });

  it("caveats match the source kind", () => {
    for (const e of evidence) {
      if (["schoenfeld-2017-volume", "schoenfeld-2016-frequency"].includes(e.cite.sourceId)) expect(e.caveat, e.text).toBe("abstract-only");
      if (["maeo-2021-hamstrings", "kinoshita-2023-calf"].includes(e.cite.sourceId)) expect(e.caveat, e.text).toBe("single-study");
    }
  });

  it("a 'group' scope needs at least 2 muscles and is not general; the Maeo hamstrings claim has it", () => {
    for (const e of evidence) if (e.scope === "group") {
      expect(e.appliesTo === "all" ? 0 : e.appliesTo.length, e.text).toBeGreaterThanOrEqual(2);
      expect(e.general, e.text).toBeUndefined();
    }
    expect(evidence.find((e) => e.cite.sourceId === "maeo-2021-hamstrings")?.scope).toBe("group");
  });

  it("appliesTo 'all' implies general", () => {
    for (const e of evidence) if (e.appliesTo === "all") expect(e.general, e.text).toBe(true);
  });

  it("evidence text does not repeat the caveat (the caveat field carries it)", () => {
    for (const e of evidence) expect(e.text).not.toMatch(/Single study|PubMed abstract only/);
  });
});
