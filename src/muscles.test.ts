// @ts-expect-error node:fs has no types: @types/node is not an allowed dependency
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { MUSCLES } from "./muscle-map";
import { muscleIdForNode, nodeNamesFor, sanitize } from "./muscles";

describe("helpers", () => {
  it("sanitize matches three.js node name sanitising", () => {
    expect(sanitize("Latissimus dorsi muscle.r")).toBe(
      "Latissimus_dorsi_muscler",
    );
  });

  it("nodeNamesFor returns .l/.r for each base node", () => {
    expect(nodeNamesFor("biceps_brachii").sort()).toEqual([
      "Long head of biceps brachii.l",
      "Long head of biceps brachii.r",
      "Short head of biceps brachii.l",
      "Short head of biceps brachii.r",
    ]);
  });

  it("nodeNamesFor keeps parentheses", () => {
    expect(nodeNamesFor("pectoralis_major")).toContain(
      "(Abdominal part of pectoralis major muscle).l",
    );

    expect(nodeNamesFor("hip_adductors")).toContain(
      "(Adductor minimus).l",
    );
  });

  it("maps raw and sanitised node names to the same id", () => {
    expect(muscleIdForNode("Short head of biceps brachii.r")).toBe(
      "biceps_brachii",
    );

    expect(
      muscleIdForNode(sanitize("Short head of biceps brachii.r")),
    ).toBe("biceps_brachii");

    expect(
      muscleIdForNode(
        "(Abdominal part of pectoralis major muscle).l",
      ),
    ).toBe("pectoralis_major");

    expect(
      muscleIdForNode(
        sanitize("(Abdominal part of pectoralis major muscle).l"),
      ),
    ).toBe("pectoralis_major");
  });

  it("maps the expanded abdominal muscles", () => {
    expect(nodeNamesFor("rectus_abdominis")).toEqual([
      "Rectus abdominis muscle.l",
      "Rectus abdominis muscle.r",
      "External abdominal oblique muscle.l",
      "External abdominal oblique muscle.r",
      "Internal abdominal oblique muscle.l",
      "Internal abdominal oblique muscle.r",
      "Transversus abdominis muscle.l",
      "Transversus abdominis muscle.r",
      "Pyramidalis muscle.l",
      "Pyramidalis muscle.r",
    ]);

    expect(
      muscleIdForNode("External abdominal oblique muscle.r"),
    ).toBe("rectus_abdominis");

    expect(
      muscleIdForNode(
        sanitize("Transversus abdominis muscle.l"),
      ),
    ).toBe("rectus_abdominis");
  });

  it("maps the forearm muscles", () => {
    expect(nodeNamesFor("forearm_muscles")).toContain(
      "Flexor carpi radialis.r",
    );

    expect(nodeNamesFor("forearm_muscles")).toContain(
      "Extensor carpi radialis longus.l",
    );

    expect(
      muscleIdForNode("Extensor carpi radialis longus.r"),
    ).toBe("forearm_muscles");

    expect(
      muscleIdForNode(sanitize("Pronator quadratus.l")),
    ).toBe("forearm_muscles");
  });

  it("maps the inner-thigh muscles", () => {
    expect(nodeNamesFor("hip_adductors")).toContain(
      "Adductor magnus.l",
    );

    expect(nodeNamesFor("hip_adductors")).toContain(
      "Gracilis muscle.r",
    );

    expect(muscleIdForNode("Adductor magnus.l")).toBe(
      "hip_adductors",
    );

    expect(
      muscleIdForNode(sanitize("(Adductor minimus).r")),
    ).toBe("hip_adductors");
  });

  it("returns undefined for unknown names", () => {
    expect(muscleIdForNode("Nonexistent.l")).toBeUndefined();
  });

  it("does not match a base name with a different suffix", () => {
    expect(
      muscleIdForNode("Soleus muscle.x"),
    ).toBeUndefined();
  });
});

describe("muscle map", () => {
  it("gives every muscle a front or back view", () => {
    expect(
      MUSCLES.filter(
        (muscle) =>
          muscle.view !== "front" && muscle.view !== "back",
      ),
    ).toEqual([]);

    expect(
      MUSCLES.filter((muscle) => muscle.view === "back").length,
    ).toBe(9);
  });

  it("contains the expected muscle groups", () => {
    expect(MUSCLES.map((muscle) => muscle.id)).toContain(
      "rectus_abdominis",
    );

    expect(MUSCLES.map((muscle) => muscle.id)).toContain(
      "forearm_muscles",
    );

    expect(MUSCLES.map((muscle) => muscle.id)).toContain(
      "hip_adductors",
    );
  });
});

describe("map vs GLB", () => {
  // GLB: 12-byte header, then chunk length (u32 LE) at 12,
  // type at 16, and JSON beginning at byte 20.
  const buffer = readFileSync(
    "public/models/muscles-draco.glb",
  );

  const json = JSON.parse(
    buffer
      .subarray(20, 20 + buffer.readUInt32LE(12))
      .toString("utf8"),
  );

  const names: string[] = json.nodes
    .filter(
      (node: { mesh?: number }) => node.mesh !== undefined,
    )
    .map((node: { name: string }) => node.name);

  it("has 485 mesh nodes with no duplicate names", () => {
    expect(names.length).toBe(485);
    expect(new Set(names).size).toBe(names.length);
  });

  it("contains all 126 mapped node names", () => {
    const available = new Set(names);
    const wanted = MUSCLES.flatMap((muscle) =>
      nodeNamesFor(muscle.id),
    );

    expect(MUSCLES.length).toBe(17);
    expect(wanted.length).toBe(126);
    expect(
      wanted.filter((name) => !available.has(name)),
    ).toEqual([]);
  });
});
