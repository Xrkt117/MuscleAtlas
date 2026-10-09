// @ts-expect-error node:fs has no types: @types/node is not an allowed dependency
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { MUSCLES } from "./muscle-map";
import { muscleIdForNode, nodeNamesFor } from "./muscles";

describe("skeleton GLB", () => {
  // GLB: 12-byte header, then chunk length (u32 LE) at 12, type at 16, JSON from 20.
  const buf = readFileSync("public/models/skeleton-draco.glb");
  const json = JSON.parse(buf.subarray(20, 20 + buf.readUInt32LE(12)).toString("utf8"));
  const names: string[] = json.nodes.map((n: { name?: string }) => n.name ?? "");

  it("exists and has at least one node with a mesh", () => {
    expect(json.nodes.filter((n: { mesh?: number }) => n.mesh !== undefined).length).toBeGreaterThanOrEqual(1);
  });

  it("shares no node name with a muscle", () => {
    const muscleNames = new Set(MUSCLES.flatMap((m) => nodeNamesFor(m.id)));
    expect(names.filter((n) => muscleNames.has(n))).toEqual([]);
  });

  it("maps no node name to a muscle id", () => {
    expect(names.filter((n) => muscleIdForNode(n) !== undefined)).toEqual([]);
  });
});
