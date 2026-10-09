// @ts-expect-error node:fs has no types: @types/node is not an allowed dependency (plan: only three, vite, typescript, vitest, @types/three)
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { MUSCLES } from "./muscle-map";
import { muscleIdForNode, nodeNamesFor, sanitize } from "./muscles";

describe("helpers", () => {
  it("sanitize matches three.js node name sanitising", () => {
    expect(sanitize("Latissimus dorsi muscle.r")).toBe("Latissimus_dorsi_muscler");
  });

  it("nodeNamesFor returns .l/.r for each base node", () => {
    expect(nodeNamesFor("biceps_brachii").sort()).toEqual([
      "Long head of biceps brachii.l",
      "Long head of biceps brachii.r",
      "Short head of biceps brachii.l",
      "Short head of biceps brachii.r",
    ]);
  });

  it("nodeNamesFor keeps the parentheses", () => {
    expect(nodeNamesFor("pectoralis_major")).toContain("(Abdominal part of pectoralis major muscle).l");
  });

  it("muscleIdForNode maps raw and sanitised names to the same id", () => {
    expect(muscleIdForNode("Short head of biceps brachii.r")).toBe("biceps_brachii");
    expect(muscleIdForNode(sanitize("Short head of biceps brachii.r"))).toBe("biceps_brachii");
    expect(muscleIdForNode("(Abdominal part of pectoralis major muscle).l")).toBe("pectoralis_major");
    expect(muscleIdForNode(sanitize("(Abdominal part of pectoralis major muscle).l"))).toBe("pectoralis_major");
  });

  it("muscleIdForNode returns undefined for unknown names", () => {
    expect(muscleIdForNode("Nonexistent.l")).toBeUndefined();
  });

  it("muscleIdForNode does not match a base name with a different suffix", () => {
    expect(muscleIdForNode("Soleus muscle.x")).toBeUndefined();
  });
});

describe("map vs GLB", () => {
  // GLB: 12-byte header, then chunk length (u32 LE) at 12, type at 16, JSON from 20.
  const buf = readFileSync("public/models/muscles-draco.glb");
  const json = JSON.parse(buf.subarray(20, 20 + buf.readUInt32LE(12)).toString("utf8"));
  const names: string[] = json.nodes.filter((n: { mesh?: number }) => n.mesh !== undefined).map((n: { name: string }) => n.name);

  it("has 485 mesh nodes with no duplicate names", () => {
    expect(names.length).toBe(485);
    expect(new Set(names).size).toBe(names.length);
  });

  it("contains all 58 seed node names", () => {
    const have = new Set(names);
    const wanted = MUSCLES.flatMap((m) => nodeNamesFor(m.id));
    expect(MUSCLES.length).toBe(15);
    expect(wanted.length).toBe(58);
    expect(wanted.filter((n) => !have.has(n))).toEqual([]);
  });
});
